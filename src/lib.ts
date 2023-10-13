import { JSONContent, generateJSON } from '@tiptap/react';
import * as HTMLConverter from 'node-html-markdown/dist'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import TaskItem from '@tiptap/extension-task-item'
import TaskList from '@tiptap/extension-task-list'
import { Converter } from 'showdown'


export const isWhiteSpaceOnly = (s: string) => !/\S/.test(s);

const options: Partial<HTMLConverter.NodeHtmlMarkdownOptions> = {
  preferNativeParser: false,
  bulletMarker: '-',
};

export const htmlToMarkdown = (editorContent: string) => {
  const md = HTMLConverter.NodeHtmlMarkdown.translate(editorContent, options, {
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
  return md;
}

export const markdownToHtml = (markdownContent: string) => {

  function processLines(lines: string[]) {
    let result = '';
    let currentList: string[] = [];

    lines.forEach((line: string) => {
      const unorderedMatch = line.match(/(- \[[ xX]\]) (.+)$/);
      const orderedMatch = line.match(/(\d+\. \[[ xX]\]) (.+)$/);

      let match, isChecked;

      if (unorderedMatch || orderedMatch) {
        match = unorderedMatch || orderedMatch;
        if (!match) return
        isChecked = match[1].toLowerCase().includes('x');
        const content = match[2].trim();
        const innerHtml = new Converter().makeHtml(content);

        currentList.push(
          `<li class="novel-flex novel-items-start novel-my-4" data-checked="${isChecked}" data-type="taskItem"><label><input type="checkbox" ${isChecked ? 'checked' : ''}><span></span></label><div>${innerHtml}</div></li>`
        );
      } else {
        result += line + '\n';
      }
    });

    if (currentList.length > 0) {
      result += '<ul>\n' + currentList.join('\n') + '\n</ul>\n';
    }

    return result;
  }

  const todoListExt = {
    type: 'lang',
    regex: /- \[( |x)\] (.+)/gi,
    replace: function(match: any, checked: string, content: string) {
      const isChecked = checked.toLowerCase() === 'x';
      const innerHtml = new Converter().makeHtml(content);
      return `<li class="novel-flex novel-items-start novel-my-4" data-checked="${isChecked}" data-type="taskItem"><label><input type="checkbox" ${isChecked ? 'checked' : ''}></label><div>${innerHtml}</div></li>`;
    }
  };

  const removePTagExt = {
    type: 'output',
    regex: /<p>(<li .+?<\/li>)<\/p>/g,
    replace: '$1'
  };

  const markdownConverter = new Converter({ extensions: [todoListExt, removePTagExt] })
  const html = markdownConverter.makeHtml(markdownContent);
  const cleanedHtml = html.replace(/<p><\/p>/g, '');
  return cleanedHtml
}

export const htmlToEditorState = (html: string): JSONContent => {
  const json = generateJSON(html,
    [StarterKit, Link, Image, TaskItem, TaskList]
  );
  console.log(json)
  return json;
}