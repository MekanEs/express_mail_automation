import React, { FC, useEffect, useState } from 'react';
import { accounts } from '../../types/types';

const Accounts: FC<{ setSelected: React.Dispatch<React.SetStateAction<accounts>> }> = ({
    setSelected
}) => {
    const [accounts, setAccounts] = useState<accounts>([]);
    const getAccounts = async () => {
        setAccounts([]);
        const res = await fetch('http://localhost:3002/api/accounts', {
            method: 'GET'
        });
        const { data } = await res.json();
        console.log('data', data);
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
        const res = await data.json();
        console.log(res);
    };
    return (
        <div>
            <h3>Accounts</h3>
            <div>
                {accounts.map((el) => (
                    <li key={el.id}>
                        <div>provider: {el.provider}</div>
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

                                setSelected((prev) => prev.filter((elem) => el.id !== elem.id));
                            }}
                            type="checkbox"
                            name=""
                            id=""
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
