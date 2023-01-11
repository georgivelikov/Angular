import firebase from 'firebase/compat/app'
export default interface IClip {
  docId?: string,
  userId: string,
  displayName: string,
  title: string,
  fileName: string,
  fileUrl: string,
  screenshotUrl: string,
  screenshotFileName: string
  timestamp: firebase.firestore.FieldValue;
}
