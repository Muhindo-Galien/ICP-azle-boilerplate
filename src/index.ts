// Canister code for Movie Tickets
import { $query, $update, Record, StableBTreeMap, Vec, match, Result, nat64, ic, Opt } from 'azle';
import { v4 as uuidv4 } from 'uuid';

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
    // Generate a cryptographically secure UUID
    const newTicketId: string = uuidv4();

    // Validate inputs
    if (movie.trim() === '') {
        return Result.Err<MovieTicket, string>('Movie name cannot be empty.');
    }
    if (seat <= 0) {
        return Result.Err<MovieTicket, string>('Invalid seat number.');
    }

    const newTicket: MovieTicket = { 
        id: newTicketId, 
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
                return Result.Err<MovieTicket, string>('This ticket is already reserved.');
            }
            const reservedTicket: MovieTicket = { ...ticket, reserved: true };
            ticketStorage.insert(ticket.id, reservedTicket);
            return Result.Ok(reservedTicket);
        },
        None: () => Result.Err<MovieTicket, string>(`Ticket with id=${id} does not exist.`)
    });
}

$update;
export function deleteTicket(id: string): Result<MovieTicket, string> {
    return match(ticketStorage.remove(id), {
        Some: (deletedTicket: MovieTicket) => Result.Ok<MovieTicket, string>(deletedTicket),
        None: () => Result.Err<MovieTicket, string>(`Ticket with id=${id} does not exist.`)
    });
}
