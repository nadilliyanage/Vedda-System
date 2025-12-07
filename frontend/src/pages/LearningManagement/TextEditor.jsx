import React, { useCallback } from 'react';
import { useEditor, EditorContent, Node, mergeAttributes } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import './Editor.css'; // Import the CSS we made above

// --- 1. DEFINE CUSTOM AUDIO EXTENSION ---
// TipTap doesn't have a built-in Audio extension, so we build a simple one here.
const AudioExtension = Node.create({
  name: 'audio',
  group: 'block', // Occupies the whole line
  atom: true,     // It's a single unit, not editable text

  addAttributes() {
    return {
      src: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'audio',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // This renders the HTML: <audio controls src="..." />
    return ['audio', mergeAttributes(HTMLAttributes, { controls: 'true' })];
  },
});

// --- 2. MAIN COMPONENT ---
const TextEditor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
      AudioExtension, // Register our custom audio node
    ],
    content: `
      <h2>Welcome to the Media Editor</h2>
      <p>You can type text, upload images, and upload audio files below.</p>
    `,
  });

  // Helper: Handles Image File Upload
  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file && editor) {
        // PRODUCTION NOTE: In a real app, upload 'file' to your server here.
        // Then use the returned URL (e.g., https://aws.com/my-image.png).
        // For this demo, we use a local preview URL.
        const url = URL.createObjectURL(file);
        
        editor.chain().focus().setImage({ src: url }).run();
      }
    };
    input.click();
  }, [editor]);

  // Helper: Handles Audio File Upload
  const addAudio = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'audio/*';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file && editor) {
        // PRODUCTION NOTE: Same as above. Upload to server first!
        const url = URL.createObjectURL(file);

        editor.chain().focus().insertContent({
          type: 'audio',
          attrs: { src: url }
        }).run();
      }
    };
    input.click();
  }, [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="text-editor-container">
      {/* TOOLBAR */}
      <div className="editor-toolbar">
        {/* Basic Formatting */}
        <button
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`editor-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
        >
          Bold
        </button>
        <button
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`editor-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
        >
          Italic
        </button>
        <button
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`editor-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
        >
          Strike
        </button>
        
        {/* Headers */}
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`editor-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
        >
          H1
        </button>
        <button
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`editor-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
        >
          H2
        </button>

        {/* Media Buttons */}
        <button onClick={addImage} className="editor-btn btn-image">
          🖼️ Image
        </button>
        <button onClick={addAudio} className="editor-btn btn-audio">
          🎵 Audio
        </button>
      </div>

      {/* EDITABLE AREA */}
      <EditorContent editor={editor} />
      
      {/* (Optional) Debug Output Area */}
      <div style={{ padding: '20px', borderTop: '1px solid #eee', background: '#fafafa', fontSize: '12px' }}>
        <strong>Current HTML Output:</strong>
        <br />
        <code style={{display:'block', marginTop:'10px', color: '#666'}}>
          {editor.getHTML()}
        </code>
      </div>
    </div>
  );
};

export default TextEditor;