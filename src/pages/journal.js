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

const saveToDB = async ({data, section}) => {
  const db = await getFirestore()
  db.collection('journals')
    .doc('1')
    .update({[section]: data})
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

const fetchDataAfterMounted = ({onLoad = () => {}} = {}) => {
  React.useEffect(() => {
    (async () => {
      console.log('Fetching...')
      const data = await load()
      console.log('Fetched', data)
      if (data) {
        onLoad(data)
      }
    })()
  }, [])
}

const emptyValue = Value.fromJSON({
  document: {
    nodes: [
      {
        object: 'block',
        type: 'paragraph',
        nodes: [
          {
            object: 'text',
            text: '',
          },
        ],
      },
    ],
  },
})

export default function () {
  const [contentValue, setContentValue] = React.useState(initialValue)
  const [keyTakeawaysValue, setKeyTakeawaysValue] = React.useState(emptyValue)

  fetchDataAfterMounted({
    onLoad: ({KEY_TAKEAWAYS, SUMMARY}) => {
      setContentValue(Value.fromJSON(SUMMARY))
      setKeyTakeawaysValue(Value.fromJSON(KEY_TAKEAWAYS))
    },
  })

  const onContentChange = ({value}) => {
    if (value.document !== contentValue.document) {
      saveToDB({section: 'SUMMARY', data: value.toJSON()})
    }
    setContentValue(value)
  }
  const onKeyTakeawaysChange = ({value}) => {
    if (value.document !== keyTakeawaysValue.document) {
      saveToDB({section: 'KEY_TAKEAWAYS', data: value.toJSON()})
    }
    setKeyTakeawaysValue(value)
  }

  return (
    <div>
      <h1>Title of the Book</h1>
      <section>
        <h2>Summary</h2>
        <Editor value={contentValue} onChange={onContentChange} />
      </section>
      <section>
        <h2>Key takeaways</h2>
        <Editor value={keyTakeawaysValue} onChange={onKeyTakeawaysChange} />
      </section>
    </div>
  )
}
