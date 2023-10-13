import React, { useState, ChangeEvent, useEffect } from 'react';
import { Editor as MyEditor } from "novel";
import * as Converter from 'node-html-markdown'
import { generateHTML } from '@tiptap/html'
import { markdownToHtml, htmlToEditorState } from 'novel-md'
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Link from '@tiptap/extension-link';

export const isWhiteSpaceOnly = (s: string) => !/\S/.test(s);

const App: React.FC = () => {
  const [editorContent, setEditorContent] = useState<string>('');
  const [html, setHTML] = useState('')
  const [outputHTML, setOutputHTML] = useState('')
  const [importedEditor, setImportedEditor] = useState({})
  const [md, setMD] = useState('')

  const options: Partial<Converter.NodeHtmlMarkdownOptions> = {
    preferNativeParser: false,
    bulletMarker: '-',
  };

  useEffect(() => {
    setHTML(generateHTML(
      JSON.parse(localStorage.getItem("novel__content") || "{}")
      , [StarterKit, Image, TaskItem, TaskList, Link]) || '')
  }, [])

  useEffect(() => {
    setEditorContent(html)
  }, [html])

  useEffect(() => {
    setOutputHTML(markdownToHtml(md))
  }, [md])

  useEffect(() => {
    setImportedEditor(htmlToEditorState(outputHTML))
  }, [outputHTML])

  useEffect(() => {
    const md = Converter.NodeHtmlMarkdown.translate(editorContent, options, {
      'li': ({ node, options: { bulletMarker }, indentLevel, listKind, listItemNumber }) => {
        const indentationLevel = +(indentLevel || 0);
        let checkboxState = '';
        const attributes = JSON.parse(JSON.stringify(node.attributes))
        console.log(attributes)

        if (attributes["class"] == 'novel-flex novel-items-start novel-my-4') {
          if (attributes['data-checked']) {
            return {
              prefix: '   '.repeat(indentationLevel),
              postprocess: ({ content }) =>
                attributes['data-checked'] == "true" ? `- [x] ${content}` : `- [ ] ${content}`
            }
          }
        }

        return {
          prefix: '   '.repeat(indentationLevel) + checkboxState +
            (((listKind === 'OL') && (listItemNumber !== undefined)) ? `${listItemNumber}. ` : `${bulletMarker} `),
          surroundingNewlines: 1,
          postprocess: ({ content }) =>
            content.trim()
              .replace(/([^\r\n])(?:\r?\n)+/g, `$1  \n${'   '.repeat(indentationLevel)}`)
              .replace(/(\S+?)[^\S\r\n]+$/gm, '$1  ')
        }
      }
    })
    setMD(md)
  }, [editorContent])

  return (
    <>
      <h1 className='header' style={{ textAlign: 'center', fontSize: '3em', marginTop: '1em' }}> Bi-directional markdown import & export for <strong>Novel.sh</strong></h1>
      <div style={{ display: 'flex', height: '100vh', 'width': '80%', 'margin': '0 auto', 'gap': '3em' }}>
        {/* Left Column: Block Editor */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <h1 className='header'> Editor </h1>
          <MyEditor onUpdate={(editor) => {
            if (!editor) return
            setHTML(editor.getHTML())
          }} />
        </div>

        {/* Right Column: Markdown Output */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <h1 className='header'> Markdown </h1>
          <pre>{md}</pre>
        </div>

        {/* Right Column: Markdown Output */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <h1 className='header'> HTML </h1>
          <div>{outputHTML}</div>
        </div>

        {/* Right Column: Markdown Output */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
          <h1 className='header'> Back to Editor </h1>
          <MyEditor key={outputHTML} defaultValue={importedEditor} disableLocalStorage />
        </div>
      </div>
    </>
  );
};

export default App;
