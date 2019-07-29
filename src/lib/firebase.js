const firebaseConfig = {
  apiKey: process.env.GATSBY_FIREBASE_API_KEY,
  authDomain: process.env.GATSBY_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.GATSBY_FIREBASE_DATABASE_URL,
  projectId: process.env.GATSBY_FIREBASE_PROJECT_ID,
  storageBucket: process.env.GATSBY_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.GATSBY_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.GATSBY_FIREBASE_APP_ID,
}

let firebaseInstance
export const getFirebase = async () => {
  if (firebaseInstance) return firebaseInstance
  const firebase = await import('firebase/app')
  firebase.initializeApp(firebaseConfig)
  firebaseInstance = firebase

  return firebase
}

let firestoreInstance
export const getFirestore = async ({mock} = {}) => {
  if (mock) {
    const emptyValue = {
      document: {
        nodes: [
          {
            object: 'block',
            type: 'paragraph',
            nodes: [
              {
                object: 'text',
                text: 'From a mock data',
              },
            ],
          },
        ],
      },
    }
    return {
      collection: () => ({
        doc: () => ({
          update: async () => {},
          get: () => ({
            data: () => ({
              KEY_TAKEAWAYS: emptyValue,
              SUMMARY: emptyValue,
            }),
          }),
        }),
      }),
    }
  }

  if (firestoreInstance) return firestoreInstance

  const [firebase] = await Promise.all([
    getFirebase(),
    import('firebase/firestore'),
  ])
  return firebase.firestore()
}
