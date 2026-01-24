import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Markdown({ content }: any) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
      {content}
    </ReactMarkdown>
  );
}
const markdownComponents = {
  ul: ({ children }: any) => (
    <ul className="list-disc list-inside my-2">{children}</ul>
  ),
  ol: ({ children }: any) => (
    <ol className="list-decimal list-inside my-2">{children}</ol>
  ),
  li: ({ children }: any) => <li className="leading-relaxed">{children}</li>,
  strong: ({ children }: any) => (
    <strong className="text-neutral-600 font-medium">{children}</strong>
  ),
  pre: ({ children }: any) => (
    <pre className="max-w-3xl overflow-hidden whitespace-pre-wrap break-words w-full">
      {children}
    </pre>
  ),
  a: ({ href, children }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sky-500 hover:underline font-medium"
    >
      {children}
    </a>
  ),
};
