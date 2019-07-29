import React from 'react'
import {Editor} from 'slate-react'
import {Value} from 'slate'
import {getFirestore} from '../lib/firebase'

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

const save = async (data) => {
  const db = await getFirestore()
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

const load = async (id = 1) => {
  const db = await getFirestore()
  const snapshot = await db
    .collection('journals')
    .doc(`${id}`)
    .get()
  return snapshot.data()
}

const fetchDataAfterMounted = ({onLoad}) => {
  React.useEffect(() => {
    (async () => {
      console.log('Fetching...')
      const data = await load()
      console.log('Fetched', data)
      if (data) {
        onLoad(Value.fromJSON(data))
      }
    })()
  }, [])
}

export default function () {
  const [journalValue, setJournalValue] = React.useState(initialValue)
  fetchDataAfterMounted({onLoad: setJournalValue})
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
