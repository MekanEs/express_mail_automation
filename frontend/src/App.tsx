import { useEffect, useState } from 'react';
import './App.css';
import Accounts from './components/accounts/Accounts';
import { accounts, from_email } from './types/types';

function App() {
    const [fromEmail, setFromEmails] = useState<(from_email & { is_selected?: boolean })[]>([]);
    const [curEmail, setCurEmail] = useState<string>('');
    const [accounts, setAccounts] = useState<accounts>([]);
    const [limit, setLimit] = useState<number>(20);
    const [isProceeded, setIsProceeded] = useState<string | null>(null);
    const process = async () => {
        setIsProceeded('\n processing');
        const data = await fetch('http://localhost:3002/api/process', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                accounts: accounts,
                emails: [...fromEmail].filter((el) => el.is_selected),
                limit
            })
        });
        const res = await data.json();
        setIsProceeded(res.is_proceeded);
        setTimeout(() => {
            setIsProceeded(null);
        }, 1000);
    };
    const getEmails = async () => {
        setFromEmails([]);
        const res = await fetch('http://localhost:3002/api/fromEmails', {
            method: 'GET'
        });
        const { data }: { data: { created_at: string; email: string; id: number }[] } =
            await res.json();

        setFromEmails(data);
    };
    const postEmails = async ({ email }: { email: string }) => {
        await fetch('http://localhost:3002/api/fromEmails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        setCurEmail('');
    };
    const deleteEmail = async (id: number) => {
        await fetch('http://localhost:3002/api/fromEmails', {
            method: 'delete',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ id: id })
        });
    };
    useEffect(() => {
        getEmails();
    }, []);
    return (
        <>
            <div>
                <button onClick={process}>Process {isProceeded !== null ? isProceeded : ''}</button>
                <button onClick={getEmails}>Get Emails</button>
                <div>
                    <input
                        value={curEmail}
                        onChange={(e) => setCurEmail(e.target.value)}
                        type="email"
                        name=""
                        id=""
                    />
                    <button onClick={() => postEmails({ email: curEmail })}>post</button>
                </div>
                <div>
                    <ul>
                        {fromEmail.map((el, ind) => {
                            return (
                                <li key={el.id}>
                                    {el.email}
                                    <button
                                        onClick={() => {
                                            deleteEmail(el.id);
                                        }}
                                    >
                                        delete
                                    </button>
                                    <input
                                        onChange={(e) => {
                                            if (e.target.checked === true) {
                                                setFromEmails((prev) => {
                                                    const newArr = [...prev];
                                                    newArr[ind].is_selected = true;
                                                    return newArr;
                                                });
                                                return;
                                            }

                                            setFromEmails((prev) => {
                                                const newArr = [...prev];
                                                newArr[ind].is_selected = false;
                                                return newArr;
                                            });
                                        }}
                                        value={el.is_selected ? 'on' : ''}
                                        type="checkbox"
                                        name=""
                                        id=""
                                    />
                                </li>
                            );
                        })}
                    </ul>
                </div>
                <Accounts setSelected={setAccounts} />
                <input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(Number(e.target.value))}
                />
            </div>
        </>
    );
}

export default App;
