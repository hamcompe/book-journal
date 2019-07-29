import React from 'react'
import {Editor as SlateEditor} from 'slate-react'
import {Value} from 'slate'
import styled from '@emotion/styled'
import {Global, css} from '@emotion/core'
import {getFirestore} from '../lib/firebase'
import {useDebounce} from '../lib/utils'

const Layout = styled.div`
  max-width: 800px;
  margin: 0 auto;
`
const Editor = styled(SlateEditor)`
  background: #fff;
  padding: 1em;
  margin: 1em -1em;
  border-radius: 8px;
  box-shadow: 0px 18px 15px -12px rgba(0, 0, 0, 0.03);
`

const USE_MOCK = false

const saveToDB = async ({data, section}) => {
  const db = await getFirestore({mock: USE_MOCK})
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
  const db = await getFirestore({mock: USE_MOCK})
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
    <Layout>
      <Global
        styles={css`
          body {
            background: #f9f9f9;
          }
          h1,
          h2 {
            margin-top: 1.2em;
            margin-bottom: 0.3em;
          }
        `}
      />
      <h1>Title of the Book</h1>
      <section>
        <h2>Summary</h2>
        <Editor value={contentValue} onChange={onContentChange} />
      </section>
      <section>
        <h2>Key takeaways</h2>
        <Editor value={keyTakeawaysValue} onChange={onKeyTakeawaysChange} />
      </section>
    </Layout>
  )
}
