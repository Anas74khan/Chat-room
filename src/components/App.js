import React, { useRef, useState } from 'react';

import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { addDoc, collection, getFirestore, limit, orderBy, query, serverTimestamp } from 'firebase/firestore';

import { firbaseConfig } from '../config';

import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollectionData } from 'react-firebase-hooks/firestore';

import styles from './App.module.css';

const firebase = initializeApp(firbaseConfig);
const auth = getAuth();
const firestore = getFirestore();

function App() {
    const [user] = useAuthState(auth);

    return (
        <div className={styles.App}>
            <div className={styles.container}>
                <Header user={user} />
                {user ? <ChatRoom /> : <SignIn />}
            </div>
        </div>
    )
}

function Header(props){
    const user = props.user;

    return user && (
        <header className={styles.header}>
            <div className={styles.user}>
                <img src={user.photoURL} alt="self" className={styles.selfImage} />
                <div>
                    <p className={styles.selfName}>{user.displayName}</p>
                    <p className={styles.selfEmail}>{user.email}</p>
                </div>
            </div>
            <SignOut />
        </header>
    );
}

function SignIn(){
    const signInWithGoogle = () => {
        const provider = new GoogleAuthProvider();
        signInWithPopup(auth,provider);
    };

    return (
        <div className={styles.signInContainer}>
            <h2>Welcome to Chat Room</h2>
            <button onClick={signInWithGoogle} className={styles.signIn}>Sign in with Google</button>
        </div>
    );
}

function SignOut(){
    return (
        <button onClick={() => signOut(auth)} className={styles.signOut}>Sign out</button>
    );
}

function ChatRoom() {
    const messageRef = collection(firestore, 'messages');
    const q = query(messageRef, orderBy('createdAt'), limit(30));
    const [messages] = useCollectionData(q, {idField: 'id'});

    const [message, setMessage] = useState('');
    const sendMessage = async(e) => {
        e.preventDefault();

        const currentUser = auth.currentUser;

        await addDoc(messageRef,{
            text: message,
            createdAt: serverTimestamp(),
            uid : currentUser.uid,
            photoUrl: currentUser.photoURL,
            name: currentUser.displayName
        });

        setMessage('');
        scroll.current.scrollIntoView({ behavior: 'smooth'})

    };

    const scroll = useRef();

    return (
        <div className={styles.chatRoom}>
            <ul className={styles.chatList}>
                { messages && messages.map(msg => <ChatMessage key={msg.id} message={msg} />)}
                <div ref={scroll}></div>
            </ul>

            <form className={styles.footer} onSubmit={sendMessage}>
                <textarea className={styles.messageInput} placeholder="Enter message..." value={message} onChange={(e) => setMessage(e.target.value)} />
                <button className={styles.sendButton}>Send</button>
            </form>
        </div>
    );
}

function ChatMessage(props) {
    const message = props.message;
    const messageClass = message.uid === auth.currentUser.uid ? styles.sent : styles.received;
    const createdAt = message.createdAt.toDate();
    const hr = createdAt.getHours() % 12;
    const mi = createdAt.getMinutes();
    const a = createdAt.getHours() / 12 > 1 ? 'PM' : 'AM';
    const current = (new Date(createdAt.getFullYear() + '' + createdAt.getMonth() + '' + createdAt.getDate())).getTime();
    
    return (
        <li className={`${styles.message} ${messageClass}`}>
            <div className={styles.chatUser}>
                {/* <img src={message.photoUrl} className={styles.userImage} alt="user"/> */}
                <p className={styles.username}>
                    {message.name}
                </p>
            </div>
            <p className={`${styles.messageText} ${messageClass}`}>
                {message.text}
                <span className={styles.date}>
                    {hr > 0 && hr < 10 ? 0 : ''}{hr}:{mi < 10 ? 0 : ''}{mi} {a}
                </span>
            </p>
        </li>
    );
}


export default App;