import React from 'react'
import {Editor} from 'slate-react'
import {Value} from 'slate'
import {getFirestore} from '../lib/firebase'
import {useDebounce} from '../lib/utils'

const saveToDB = async ({data, section}) => {
  const db = await getFirestore({mock: true})
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
  const db = await getFirestore({mock: true})
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
  const [contentValue, setContentValue] = React.useState(emptyValue)
  const [keyTakeawaysValue, setKeyTakeawaysValue] = React.useState(emptyValue)
  const debounceSaveSummary = useDebounce(
    () => saveToDB({section: 'SUMMARY', data: contentValue.toJSON()}),
    800,
  )
  const debounceSaveKeyTakeaways = useDebounce(
    () => saveToDB({section: 'KEY_TAKEAWAYS', data: keyTakeawaysValue.toJSON()}),
    800,
  )

  fetchDataAfterMounted({
    onLoad: ({KEY_TAKEAWAYS, SUMMARY} = {}) => {
      setContentValue(Value.fromJSON(SUMMARY))
      setKeyTakeawaysValue(Value.fromJSON(KEY_TAKEAWAYS))
    },
  })

  const onContentChange = ({value}) => {
    if (value.document !== contentValue.document) {
      debounceSaveSummary()
    }
    setContentValue(value)
  }
  const onKeyTakeawaysChange = ({value}) => {
    if (value.document !== keyTakeawaysValue.document) {
      debounceSaveKeyTakeaways()
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
