import React from 'react'
import {Editor as SlateEditor} from 'slate-react'
import {Value} from 'slate'
import styled from '@emotion/styled'
import {getFirestore} from '../lib/firebase'
import '../components/layout.css'
import {useDebounce} from '../lib/utils'

const USE_MOCK = false

enum JournalContentType {
  Summary = 'SUMMARY',
  Title = 'TITLE',
  KeyTakeaways = 'KEY_TAKEAWAYS',
  IsPublish = 'IS_PUBLISH',
}

const PublishButtonWrapper = styled.div`
  position: fixed;
  top: 2rem;
  right: 2rem;
`
const Button = styled.button`
  min-width: 6.25rem;
  border-radius: 0.25rem;
  font-size: 1rem;
  font-weight: 500;
  line-height: 1;
  white-space: nowrap;
  border: none;
  text-align: center;
  padding: 0.75rem 1.5rem;
  transition: all 0.3s ease;
  cursor: pointer;

  background: rgb(0, 90, 255);
  box-shadow: inset 0 -1px 0 rgba(0, 0, 0, 0.1), 0 1px 3px rgba(0, 90, 255, 0.7);
  color: #fff;
  &:hover {
    color: #fff;
    box-shadow: inset 0 0 0 rgba(0, 0, 0, 0.1),
      0 5px 8px -2px rgba(0, 90, 255, 0.7);
    background: rgb(30, 110, 255);
  }
  &:active {
    transform: scale(0.98);
  }
`

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

  ${props =>
    props.isEmpty &&
    `
    &::after {
      content: '${props.customPlaceholder}';
      display: block;
      margin-top: -1.45em;
      color: #a9a9a9;
    }
  `};
`

const saveToDB = async ({
  data,
  section,
}: {
  data: any
  section: JournalContentType
}) => {
  const db = await getFirestore({mock: USE_MOCK})
  db.collection('journals')
    .doc('1')
    .update({[section]: data})
    .then(() => {
      console.log('Document wrote')
    })
    .catch(error => {
      console.error('Error adding document: ', error)
    })
}

type DatabaseResult = {
  [JournalContentType.KeyTakeaways]: any
  [JournalContentType.Summary]: any
  [JournalContentType.Title]: string
  [JournalContentType.IsPublish]: boolean
}
const load = async (id: number = 1): Promise<DatabaseResult> => {
  const db = await getFirestore({mock: USE_MOCK})
  const snapshot = await db
    .collection('journals')
    .doc(`${id}`)
    .get()
  return snapshot.data()
}

const fetchDataAfterMounted = ({onLoad}: {onLoad: (DatabaseResult) => any}) => {
  React.useEffect(() => {
    ;(async () => {
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

export default function() {
  const [loading, setLoading] = React.useState(true)
  const [contentValue, setContentValue] = React.useState(emptyValue)
  const [keyTakeawaysValue, setKeyTakeawaysValue] = React.useState(emptyValue)
  const [cover, setCover] = React.useState('')
  const [isPublish, setIsPublish] = React.useState(false)

  const debounceSaveSummary = useDebounce(
    () =>
      saveToDB({
        section: JournalContentType.Summary,
        data: contentValue.toJSON(),
      }),
    800,
  )
  const debounceSaveKeyTakeaways = useDebounce(
    () =>
      saveToDB({
        section: JournalContentType.KeyTakeaways,
        data: keyTakeawaysValue.toJSON(),
      }),
    800,
  )
  const debounceSaveTitle = useDebounce(
    () => saveToDB({section: JournalContentType.Title, data: cover}),
    800,
  )

  fetchDataAfterMounted({
    onLoad: ({KEY_TAKEAWAYS, SUMMARY, TITLE, IS_PUBLISH}: DatabaseResult) => {
      if (TITLE) {
        setCover(TITLE)
      }
      if (SUMMARY) {
        setContentValue(Value.fromJSON(SUMMARY))
      }
      if (KEY_TAKEAWAYS) {
        setKeyTakeawaysValue(Value.fromJSON(KEY_TAKEAWAYS))
      }
      if (IS_PUBLISH) {
        setIsPublish(IS_PUBLISH)
      }
      setLoading(false)
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
  const onTitleChange = event => {
    setCover(event.target.value)
    debounceSaveTitle()
  }

  const publishButtonHandler = async () => {
    try {
      await saveToDB({section: JournalContentType.IsPublish, data: !isPublish})
      setIsPublish(!isPublish)
    } catch (e) {
      console.error(e)
      alert('Something went wrong.')
    }
  }

  return loading ? (
    <Layout>
      <p
        style={{
          marginTop: '2rem',
        }}
      >
        loading...
      </p>
    </Layout>
  ) : (
    <Layout>
      <PublishButtonWrapper>
        <p>Status: {isPublish ? 'Published' : 'Drafting...'}</p>
        <Button onClick={publishButtonHandler}>
          {isPublish ? 'Unpublish' : 'Publish'}
        </Button>
      </PublishButtonWrapper>
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
  )
}
