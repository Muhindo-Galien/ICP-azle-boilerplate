// Canister code for Movie Tickets
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';

type MovieTicket = Record<{
    id: string;
    movie: string;
    seat: nat64;
    reserved: boolean;
    createdAt: nat64;
}>;

const ticketStorage = new StableBTreeMap<string, MovieTicket>(0, 44, 1024);

$query;
export function getAllTickets(): Result<Vec<MovieTicket>, string> {
    return Result.Ok(ticketStorage.values());
}

$query;
export function getTicket(id: string): Result<MovieTicket, string> {
    return match(ticketStorage.get(id), {
        Some: (ticket: MovieTicket) => Result.Ok<MovieTicket, string>(ticket),
        None: () => Result.Err<MovieTicket, string>(`Ticket with id=${id} not found.`)
    });
}

$update;
export function addTicket(movie: string, seat: nat64): Result<MovieTicket, string> {
    const newTicket: MovieTicket = { 
        id: `${Math.random().toString(36).substr(2, 9)}`, 
        movie: movie,
        seat: seat, 
        reserved: false, 
        createdAt: ic.time() 
    };
    ticketStorage.insert(newTicket.id, newTicket);
    return Result.Ok(newTicket);
}

$update;
export function reserveTicket(id: string): Result<MovieTicket, string> {
    return match(ticketStorage.get(id), {
        Some: (ticket: MovieTicket) => {
            if (ticket.reserved) {
                return Result.Err<MovieTicket, string>("This ticket is already reserved.") as Result<MovieTicket, string>;
            }
            const reservedTicket: MovieTicket = { ...ticket, reserved: true };
            ticketStorage.insert(ticket.id, reservedTicket);
            return Result.Ok(reservedTicket) as Result<MovieTicket, string>;
        },
        None: () => Result.Err<MovieTicket, string>(`Ticket with id=${id} does not exist.`) as Result<MovieTicket, string>
    });
}


$update;
export function deleteTicket(id: string): Result<MovieTicket, string> {
    return match(ticketStorage.remove(id), {
        Some: (deletedTicket: MovieTicket) => Result.Ok<MovieTicket, string>(deletedTicket),
        None: () => Result.Err<MovieTicket, string>(`Ticket with id=${id} does not exist.`)
    });
}
