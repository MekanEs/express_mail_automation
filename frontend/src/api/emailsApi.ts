import { from_email } from "../types/types";

const API_URL = 'http://localhost:3002/api';

export const getEmails = async (): Promise<from_email[]> => {
    const res = await fetch(`${API_URL}/fromEmails`, {
        method: 'GET'
    });
    const { data } = await res.json();
    return data;
};

export const addEmail = async (email: string): Promise<void> => {
    await fetch(`${API_URL}/fromEmails`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
    });
};

export const deleteEmail = async (id: number): Promise<void> => {
    await fetch(`${API_URL}/fromEmails`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
    });
};
