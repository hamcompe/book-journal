import React from 'react'
import {Editor} from 'slate-react'
import {Value} from 'slate'

const initialValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            text: 'A line of text in a paragraph.',
          },
        ],
      },
    ],
  },
})

export default function () {
  const [journalValue, setJournalValue] = React.useState(initialValue)

  return (
    <div>
      <h1>Hello Journal</h1>
      <Editor
        value={journalValue}
        onChange={({value}) => setJournalValue(value)}
      />
    </div>
  )
}
