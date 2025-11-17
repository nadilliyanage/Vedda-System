#!/usr/bin/env python3
"""
Vedda System - Dependency Update Script
Automatically updates Python dependencies across all microservices with advanced features:
- Backup creation for requirements files
- Health checks after updates
- Logging to file with timestamps
- JSON reports for tracking
- Command-line options for customization
"""

import os
import subprocess
import sys
import json
from pathlib import Path
from datetime import datetime

class DependencyUpdater:
    def __init__(self, project_root=None):
        self.project_root = Path(project_root) if project_root else Path(__file__).parent
        self.services = [
            "backend/api-gateway",
            "backend/dictionary-service", 
            "backend/translator-service",
            "backend/history-service"
        ]
        self.log_file = self.project_root / "dependency_update.log"
        
    def log(self, message):
        """Log message to both console and file"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {message}"
        print(message)
        
        with open(self.log_file, "a", encoding="utf-8") as f:
            f.write(log_entry + "\n")

    def run_command(self, command, cwd=None):
        """Run a command and return the result"""
        try:
            result = subprocess.run(
                command, 
                shell=True, 
                cwd=cwd, 
                capture_output=True, 
                text=True, 
                check=True
            )
            return True, result.stdout.strip()
        except subprocess.CalledProcessError as e:
            return False, e.stderr.strip()

    def check_service_health(self):
        """Check if services can import their dependencies"""
        print("\n🏥 Checking service health...")
        
        health_checks = {
            "flask": "import flask; print(f'Flask {flask.__version__}')",
            "requests": "import requests; print(f'Requests {requests.__version__}')",
            "pandas": "import pandas as pd; print(f'Pandas {pd.__version__}')"
        }
        
        for package, check_cmd in health_checks.items():
            success, output = self.run_command(f'python -c "{check_cmd}"')
            if success:
                self.log(f"✅ {package}: {output}")
            else:
                self.log(f"❌ {package}: Import failed - {output}")

    def backup_requirements(self):
        """Create backup of all requirements files"""
        backup_dir = self.project_root / "requirements_backup"
        backup_dir.mkdir(exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Backup main requirements
        main_req = self.project_root / "requirements.txt"
        if main_req.exists():
            backup_file = backup_dir / f"requirements_{timestamp}.txt"
            backup_file.write_text(main_req.read_text())
            self.log(f"📋 Backed up main requirements to {backup_file}")
        
        # Backup service requirements
        for service in self.services:
            service_req = self.project_root / service / "requirements.txt"
            if service_req.exists():
                service_name = service.replace("/", "_").replace("backend_", "")
                backup_file = backup_dir / f"{service_name}_requirements_{timestamp}.txt"
                backup_file.write_text(service_req.read_text())
                self.log(f"📋 Backed up {service} requirements")

    def generate_report(self, updated_packages):
        """Generate update report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "updated_packages": updated_packages,
            "services_updated": len(self.services) + 1,  # +1 for main project
        }
        
        report_file = self.project_root / f"update_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(report_file, "w") as f:
            json.dump(report, f, indent=2)
        
        self.log(f"📄 Update report saved to {report_file}")

    def update_dependencies(self, create_backup=True, health_check=True):
        """Main update function with advanced features"""
        self.log("🔄 Starting Vedda System dependency update...")
        updated_packages = []
        
        if create_backup:
            self.backup_requirements()
        
        # Update main project dependencies
        self.log("\n📦 Updating main project dependencies...")
        main_requirements = self.project_root / "requirements.txt"
        if main_requirements.exists():
            success, output = self.run_command(
                f'pip install -r "{main_requirements}" --upgrade', 
                cwd=self.project_root
            )
            if success:
                self.log("✅ Main dependencies updated successfully")
                updated_packages.append("main_project")
            else:
                self.log(f"❌ Failed to update main dependencies: {output}")
        
        # Update each microservice
        for service in self.services:
            service_path = self.project_root / service
            requirements_file = service_path / "requirements.txt"
            
            if requirements_file.exists():
                self.log(f"\n📦 Updating {service} dependencies...")
                success, output = self.run_command(
                    f"pip install -r requirements.txt --upgrade", 
                    cwd=service_path
                )
                if success:
                    self.log(f"✅ {service} dependencies updated successfully")
                    updated_packages.append(service)
                else:
                    self.log(f"❌ Failed to update {service} dependencies: {output}")
            else:
                self.log(f"⚠️  No requirements.txt found in {service}")
        
        # Check for outdated packages
        self.log("\n🔍 Checking for remaining outdated packages...")
        success, output = self.run_command("pip list --outdated")
        if success and output.strip():
            self.log("📋 Remaining outdated packages:")
            self.log(output)
        else:
            self.log("✅ All packages are up to date!")
        
        if health_check:
            self.check_service_health()
        
        self.generate_report(updated_packages)
        self.log("\n🎉 Dependency update completed!")

def main():
    """Main entry point with command line options"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Vedda System Dependency Updater")
    parser.add_argument("--no-backup", action="store_true", help="Skip creating backup files")
    parser.add_argument("--no-health-check", action="store_true", help="Skip health checks")
    parser.add_argument("--project-root", help="Custom project root path")
    
    args = parser.parse_args()
    
    updater = DependencyUpdater(args.project_root)
    updater.update_dependencies(
        create_backup=not args.no_backup,
        health_check=not args.no_health_check
    )

if __name__ == "__main__":
    main()