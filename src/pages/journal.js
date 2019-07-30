import React from 'react'
import {Editor as SlateEditor} from 'slate-react'
import {Value} from 'slate'
import styled from '@emotion/styled'
import {getFirestore} from '../lib/firebase'
import '../components/layout.css'
import {useDebounce} from '../lib/utils'

const USE_MOCK = false

const TitleEditable = styled.input`
  font-size: 2.25rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
  min-height: 2.25rem;
  line-height: 1.3;
  cursor: text;
  border: none;
  font-weight: 500;
  padding: 0;
  width: 100%;
`

const Section = styled.div``

const Layout = styled.div`
  max-width: 800px;
  margin: 0 auto;
`
const Editor = styled(SlateEditor)`
  cursor: text;

  /* Fix differenciate height size between placeholder and actual content */
  > * {
    min-height: 1.6em;
  }

  ${props => props.isEmpty
    && `
    &::after {
      content: '${props.customPlaceholder}';
      display: block;
      margin-top: -1.45em;
      color: #a9a9a9;
    }
  `};
`

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
  const [cover, setCover] = React.useState('')

  const debounceSaveSummary = useDebounce(
    () => saveToDB({section: 'SUMMARY', data: contentValue.toJSON()}),
    800,
  )
  const debounceSaveKeyTakeaways = useDebounce(
    () => saveToDB({section: 'KEY_TAKEAWAYS', data: keyTakeawaysValue.toJSON()}),
    800,
  )
  const debounceSaveTitle = useDebounce(
    () => saveToDB({section: 'TITLE', data: cover}),
    800,
  )

  fetchDataAfterMounted({
    onLoad: ({KEY_TAKEAWAYS, SUMMARY, TITLE} = {}) => {
      if (TITLE) {
        setCover(TITLE)
      }
      if (SUMMARY) {
        setContentValue(Value.fromJSON(SUMMARY))
      }
      if (KEY_TAKEAWAYS) {
        setKeyTakeawaysValue(Value.fromJSON(KEY_TAKEAWAYS))
      }
    },
  })

  const onContentChange = ({value}) => {
    setContentValue(value)
    if (value.document !== contentValue.document) {
      debounceSaveSummary()
    }
  }
  const onKeyTakeawaysChange = ({value}) => {
    setKeyTakeawaysValue(value)
    if (value.document !== keyTakeawaysValue.document) {
      debounceSaveKeyTakeaways()
    }
  }
  const onTitleChange = (event) => {
    setCover(event.target.value)
    debounceSaveTitle()
  }

  return (
    <Section>
      <Layout>
        <TitleEditable
          type="text"
          placeholder="Book name"
          onChange={onTitleChange}
          value={cover}
        />
        <section>
          <h2>Summary</h2>
          <Editor
            isEmpty={contentValue.document.text === ''}
            customPlaceholder="What was the book about? Tell an amazing story that even 5 year-old child have to get excited."
            value={contentValue}
            onChange={onContentChange}
          />
        </section>
        <section>
          <h2>Key takeaways</h2>
          <Editor
            isEmpty={keyTakeawaysValue.document.text === ''}
            customPlaceholder="What is the key takeaways for this book? Write down the bullet points or notes for key takeaways this will help yourself to remember the core concept of the book."
            value={keyTakeawaysValue}
            onChange={onKeyTakeawaysChange}
          />
        </section>
      </Layout>
    </Section>
  )
}
