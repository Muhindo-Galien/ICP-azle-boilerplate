// cannister code goes here
// cannister code goes here
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

type Ticket = Record<{
    id: string;
    movie: string;
    placement: nat64;
    reserved: boolean;
    createdAt: nat64;
    updatedAt: Opt<nat64>
}>

type TicketPayload = Record<{
    movie: string;
    placement: nat64;
}>

const messageStorage = new StableBTreeMap<string, Ticket>(0, 44, 1024);

$query;
export function getTickets(): Result<Vec<Ticket>, string> {
    return Result.Ok(messageStorage.values());
}

$query;
export function getTicket(id: string): Result<Ticket, string> {
    return match(messageStorage.get(id), {
        Some: (message) => Result.Ok<Ticket, string>(message),
        None: () => Result.Err<Ticket, string>(`ticket with id=${id} not found`)
    });
}

$update;
export function addTicket(payload: TicketPayload): Result<Ticket, string> {
    const ticket: Ticket = { id: uuidv4(), createdAt: ic.time(), updatedAt: Opt.None, reserved: false, ...payload };
    messageStorage.insert(ticket.id, ticket);
    return Result.Ok(ticket);
}

$update;
export function buyTicket(id: string): Result<Ticket, string> {
    return match(messageStorage.get(id), {
        Some: (message) => {
            const ticketToBuy: Ticket = { ...message };
            if (ticketToBuy.reserved)
                return Result.Err<Ticket, string>(`Ticket for placement ${ticketToBuy.placement} already reserved`)
            else {
                const reservedTicket: Ticket = { ...message, reserved: true, updatedAt: Opt.Some(ic.time()) };
                messageStorage.insert(message.id, reservedTicket);
                return Result.Ok<Ticket, string>(reservedTicket);
            }
        },
        None: () => Result.Err<Ticket, string>(`ticket with id=${id} does not exist.`)
    });
}

$update;
export function revokeTicket(id: string): Result<Ticket, string> {
    return match(messageStorage.get(id), {
        Some: (message) => {
            const ticketToRevoke: Ticket = { ...message }
            if (!ticketToRevoke.reserved)
                return Result.Err<Ticket, string>(`Ticket with placement ${ticketToRevoke.placement} is free.`)
            else {
                const revokedTicket: Ticket = { ...message, reserved: false };
                return Result.Ok<Ticket, string>(revokedTicket)
            }
        },
        None: () => Result.Err<Ticket, string>(`ticket with id=${id} does not exist.`)
    });
}

$update;
export function deleteTicket(id: string): Result<Ticket, string> {
    return match(messageStorage.remove(id), {
        Some: (deletedMessage) => Result.Ok<Ticket, string>(deletedMessage),
        None: () => Result.Err<Ticket, string>(`ticket with id=${id} does not exist.`)
    });
}

// a workaround to make uuid package work with Azle
globalThis.crypto = {
    // @ts-ignore
    getRandomValues: () => {
        let array = new Uint8Array(32)

        for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256)
        }

        return array
    }
}