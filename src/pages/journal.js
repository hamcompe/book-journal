import React from 'react'
import {Editor} from 'slate-react'
import {Value} from 'slate'

const existingValue = JSON.parse(localStorage.getItem('content'))

const initialValue = Value.fromJSON(
  existingValue || {
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
  },
)

export default function () {
  const [journalValue, setJournalValue] = React.useState(initialValue)

  const onChange = ({value}) => {
    if (value.document !== journalValue.document) {
      const content = JSON.stringify(value.toJSON())
      localStorage.setItem('content', content)
    }

    setJournalValue(value)
  }

  return (
    <div>
      <h1>Hello Journal</h1>
      <Editor value={journalValue} onChange={onChange} />
    </div>
  )
}
