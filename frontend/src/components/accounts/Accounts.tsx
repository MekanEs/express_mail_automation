import React, { FC, useEffect, useState } from 'react';
import { account, accounts } from '../../types/types';

const Accounts: FC<{ setSelected: React.Dispatch<React.SetStateAction<accounts> & { is_checked?: boolean }> }> = ({
    setSelected
}) => {
    const [accounts, setAccounts] = useState<(account & { is_checked?: boolean })[]>([]);
    const [checked, setChecked] = useState<string[]>([])
    const getAccounts = async () => {
        setAccounts([]);
        const res = await fetch('http://localhost:3002/api/accounts', {
            method: 'GET'
        });
        const { data }: { data: (account & { is_checked?: boolean })[] } = await res.json();

        setAccounts(data);
    };

    useEffect(() => {
        console.log('get accs');

        getAccounts();
    }, []);
    const check = async (accounts: accounts) => {
        const data = await fetch('http://localhost:3002/api/checkAccounts', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ accounts: accounts })
        });
        const res: string[] = await data.json();
        setChecked(res)
        console.log(res, accounts)

    };
    return (
        <div>
            <h3>Accounts</h3>
            <div>
                {accounts.map((el) => (
                    <li key={el.id}>
                        <span>email: {el.email}</span>
                        <input
                            onChange={(e) => {
                                if (e.target.checked === true) {
                                    setSelected((prev) => {
                                        const newArr = [...prev];
                                        newArr.push(el);
                                        return newArr;
                                    });
                                    return;
                                }

                                setSelected((prev) => [...prev].filter((elem) => el.id !== elem.id));
                            }}
                            type="checkbox"
                            name=""
                            id=""
                        />
                        <input
                            checked={checked.includes(el.email ?? '')}
                            type="checkbox"
                            name=""
                            id=""
                            readOnly
                        />

                    </li>
                ))}
            </div>
            <button
                onClick={async () => {
                    await check(accounts);
                    getAccounts();
                }}
            >
                check
            </button>
            <button
                onClick={() => {
                    getAccounts();
                }}
            >
                reload accounts
            </button>
        </div>
    );
};
export default Accounts;
