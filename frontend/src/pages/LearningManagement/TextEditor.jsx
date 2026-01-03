import React, { useCallback, useEffect } from 'react';
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
const TextEditor = ({ value = '', onChange }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'editor-image',
        },
      }),
      AudioExtension, // Register our custom audio node
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      // Call the onChange handler with the current HTML content
      if (onChange) {
        onChange(editor.getHTML());
      }
    },
  });

  // Sync external value changes to editor
  useEffect(() => {
    if (editor && value !== undefined) {
      const currentContent = editor.getHTML();
      // Only update if value is different from current content
      if (value !== currentContent) {
        editor.commands.setContent(value || '', false);
      }
    }
  }, [editor, value]);

  // Helper: Handles Image File Upload
  const addImage = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';

    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file && editor) {
        // Convert image to Base64 for storage in MongoDB
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target.result;
          editor.chain().focus().setImage({ src: base64Url }).run();
        };
        reader.readAsDataURL(file);
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
        // Convert audio to Base64 for storage in MongoDB
        const reader = new FileReader();
        reader.onload = (event) => {
          const base64Url = event.target.result;
          editor.chain().focus().insertContent({
            type: 'audio',
            attrs: { src: base64Url }
          }).run();
        };
        reader.readAsDataURL(file);
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
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`editor-btn ${editor.isActive('bold') ? 'is-active' : ''}`}
        >
          Bold
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`editor-btn ${editor.isActive('italic') ? 'is-active' : ''}`}
        >
          Italic
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`editor-btn ${editor.isActive('strike') ? 'is-active' : ''}`}
        >
          Strike
        </button>
        
        {/* Headers */}
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={`editor-btn ${editor.isActive('heading', { level: 1 }) ? 'is-active' : ''}`}
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`editor-btn ${editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}`}
        >
          H2
        </button>

        {/* Media Buttons */}
        <button type="button" onClick={addImage} className="editor-btn btn-image">
          🖼️ Image
        </button>
        <button type="button" onClick={addAudio} className="editor-btn btn-audio">
          🎵 Audio
        </button>
      </div>

      {/* EDITABLE AREA */}
      <EditorContent editor={editor} />
    </div>
  );
};

export default TextEditor;