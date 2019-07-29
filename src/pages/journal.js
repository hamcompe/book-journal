import React from 'react'
import {Editor} from 'slate-react'
import {Value} from 'slate'
import {getDB} from '../lib/firebase'

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

const fetchData = ({onLoad}) => {
  const load = async (id = 1) => {
    const db = await getDB()
    const snapshot = await db
      .collection('journals')
      .doc(`${id}`)
      .get()
    return snapshot.data()
  }

  React.useEffect(() => {
    async function fetch() {
      const data = await load()
      console.log('data', data)
      if (data) {
        onLoad(Value.fromJSON(data))
      }
    }
    fetch()
  }, [])
}

const save = async (data) => {
  const db = await getDB()
  db.collection('journals')
    .doc('1')
    .set(data)
    .then(() => {
      console.log('Document wrote')
    })
    .catch((error) => {
      console.error('Error adding document: ', error)
    })
}

export default function () {
  const [journalValue, setJournalValue] = React.useState(initialValue)
  fetchData({onLoad: setJournalValue})
  const onChange = ({value}) => {
    if (value.document !== journalValue.document) {
      save(value.toJSON())
      setJournalValue(value)
    }
  }

  return (
    <div>
      <h1>Hello Journal</h1>
      <Editor value={journalValue} onChange={onChange} />
    </div>
  )
}
