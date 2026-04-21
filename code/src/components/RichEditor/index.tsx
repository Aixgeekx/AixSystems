// 富文本编辑器 - TipTap 封装,带工具栏
import React, { useEffect } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Button, Space, Tooltip, Divider } from 'antd';
import {
  BoldOutlined, ItalicOutlined, StrikethroughOutlined, UnorderedListOutlined, OrderedListOutlined,
  LinkOutlined, PictureOutlined, BlockOutlined, UndoOutlined, RedoOutlined, CodeOutlined
} from '@ant-design/icons';

interface Props {
  value?: string;
  onChange?: (html: string) => void;
  placeholder?: string;
  minRows?: number;
  readOnly?: boolean;
}

function ToolBtn({ active, onClick, icon, tip }: any) {
  return <Tooltip title={tip}><Button size="small" type={active ? 'primary' : 'text'} icon={icon} onClick={onClick} /></Tooltip>;
}

function Toolbar({ editor }: { editor: Editor }) {
  if (!editor) return null;
  const cmd = editor.chain().focus();
  return (
    <Space wrap size={2} style={{ padding: 6, borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
      <ToolBtn tip="加粗 Ctrl+B" active={editor.isActive('bold')}     onClick={() => cmd.toggleBold().run()}     icon={<BoldOutlined />} />
      <ToolBtn tip="斜体 Ctrl+I" active={editor.isActive('italic')}   onClick={() => cmd.toggleItalic().run()}   icon={<ItalicOutlined />} />
      <ToolBtn tip="删除线"       active={editor.isActive('strike')}   onClick={() => cmd.toggleStrike().run()}   icon={<StrikethroughOutlined />} />
      <ToolBtn tip="行内代码"     active={editor.isActive('code')}     onClick={() => cmd.toggleCode().run()}     icon={<CodeOutlined />} />
      <Divider type="vertical" style={{ margin: '0 4px' }} />
      <ToolBtn tip="无序列表" active={editor.isActive('bulletList')}  onClick={() => cmd.toggleBulletList().run()}  icon={<UnorderedListOutlined />} />
      <ToolBtn tip="有序列表" active={editor.isActive('orderedList')} onClick={() => cmd.toggleOrderedList().run()} icon={<OrderedListOutlined />} />
      <ToolBtn tip="引用块"   active={editor.isActive('blockquote')}  onClick={() => cmd.toggleBlockquote().run()}  icon={<BlockOutlined />} />
      <Divider type="vertical" style={{ margin: '0 4px' }} />
      <ToolBtn tip="插入链接" active={editor.isActive('link')} onClick={() => {
        const prev = editor.getAttributes('link').href;
        const url = window.prompt('链接地址', prev || 'https://');
        if (url === null) return;
        if (url === '') cmd.extendMarkRange('link').unsetLink().run();
        else cmd.extendMarkRange('link').setLink({ href: url }).run();
      }} icon={<LinkOutlined />} />
      <ToolBtn tip="插入图片" onClick={() => {
        const input = document.createElement('input');
        input.type = 'file'; input.accept = 'image/*';
        input.onchange = () => {
          const f = input.files?.[0];
          if (!f) return;
          const r = new FileReader();
          r.onload = () => cmd.setImage({ src: String(r.result) }).run();
          r.readAsDataURL(f);
        };
        input.click();
      }} icon={<PictureOutlined />} />
      <Divider type="vertical" style={{ margin: '0 4px' }} />
      <ToolBtn tip="撤销 Ctrl+Z" onClick={() => cmd.undo().run()} icon={<UndoOutlined />} />
      <ToolBtn tip="重做 Ctrl+Y" onClick={() => cmd.redo().run()} icon={<RedoOutlined />} />
    </Space>
  );
}

export default function RichEditor({ value, onChange, placeholder, minRows = 8, readOnly }: Props) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: placeholder || '开始输入...' }),
      Link.configure({ openOnClick: true, autolink: true, HTMLAttributes: { target: '_blank', rel: 'noopener' } }),
      Image.configure({ inline: false })
    ],
    content: value || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => onChange?.(editor.getHTML())
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== undefined && value !== editor.getHTML()) {
      editor.commands.setContent(value || '', { emitUpdate: false } as any);
    }
  }, [value, editor]);

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
      {!readOnly && editor && <Toolbar editor={editor} />}
      <div style={{ padding: '8px 12px', minHeight: minRows * 22, cursor: 'text' }} onClick={() => editor?.commands.focus()}>
        <EditorContent editor={editor} />
      </div>
      <style>{`
        .ProseMirror { outline: none; min-height: ${minRows * 22}px; }
        .ProseMirror p.is-editor-empty:first-child::before { color: #bfbfbf; content: attr(data-placeholder); float: left; pointer-events: none; height: 0; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 20px; }
        .ProseMirror blockquote { border-left: 3px solid #ddd; padding-left: 12px; color: #666; margin: 6px 0; }
        .ProseMirror code { background: #f5f5f5; padding: 1px 4px; border-radius: 3px; }
        .ProseMirror pre { background: #1e1e1e; color: #eee; padding: 10px; border-radius: 6px; overflow-x: auto; }
        .ProseMirror img { max-width: 100%; border-radius: 4px; }
        .ProseMirror a { color: #1677ff; text-decoration: underline; }
      `}</style>
    </div>
  );
}
