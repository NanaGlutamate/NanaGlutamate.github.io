"use client"

import * as React from 'react'
import * as PageType from "@/lib/pagetype"
import { Highlight, themes, Prism } from 'prism-react-renderer'
import useDarkMode from '@/lib/hooks/useDarkMode'

export const CodeBlock: React.FC<{ block: PageType.PageNodeAny }> = ({ block }) => {
    const darkMode = useDarkMode()

    const b = block as PageType.PageNodeCode
    const lang = b.code.language.toLowerCase()
    const content = b.code.rich_text.map(t => t.plain_text).join('')
    const theme = darkMode ? themes.nightOwl : themes.nightOwlLight
    return (
        <pre className={`code language-${lang}`}>
            <div className="highlight-gray">{lang}</div>
            <hr />
            <Highlight theme={theme} code={content} language={lang} prism={Prism}>
                {({ tokens, getLineProps, getTokenProps }) => (
                    <code className={`language-${lang}`}>
                        {tokens.map((line, i) => {
                            const {style, className } = getLineProps({ line, key: i })
                            return (
                                <div style={style} className={className} key={i}>
                                    {line.map((token, key) => {
                                        const {style, className, children } = getTokenProps({ token, key })
                                        return (
                                            <span style={style} className={className} key={key}>{children}</span>
                                        )
                                    })}
                                </div>
                            )
                        })}
                    </code>
                )}
            </Highlight>
        </pre>
    )
}