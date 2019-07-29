import React from 'react'
import {Editor} from 'slate-react'
import {Value} from 'slate'

import * as firebase from 'firebase/app'
import 'firebase/firestore'

const firebaseConfig = {
  apiKey: process.env.GATSBY_FIREBASE_API_KEY,
  authDomain: process.env.GATSBY_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.GATSBY_FIREBASE_DATABASE_URL,
  projectId: process.env.GATSBY_FIREBASE_PROJECT_ID,
  storageBucket: process.env.GATSBY_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.GATSBY_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.GATSBY_FIREBASE_APP_ID,
}

firebase.initializeApp(firebaseConfig)
const db = firebase.firestore()

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

const load = async (id = 1) => {
  const snapshot = await db
    .collection('journals')
    .doc(`${id}`)
    .get()
  return snapshot.data()
}

const save = (data) => {
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

  React.useEffect(() => {
    async function fetch() {
      const data = await load()
      console.log('data', data)
      if (data) {
        // setJournalValue(data)
        setJournalValue(Value.fromJSON(data))
      }
    }
    fetch()
  }, [])

  const onChange = ({value}) => {
    if (value.document !== journalValue.document) {
      const content = JSON.stringify(value.toJSON())
      localStorage.setItem('content', content)
      save(value.toJSON())
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
