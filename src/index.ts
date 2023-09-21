import {
  $query,
  $update,
  Record,
  StableBTreeMap,
  Vec,
  match,
  Result,
  nat64,
  ic,
  Opt,
  Principal,
} from "azle";
import { v4 as uuidv4 } from "uuid";

type User = Record<{
  id: string;
  name: string;
  email: string;
  age: nat64;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type Flight = Record<{
  id: string;
  owner: Principal;
  companyName: string;
  departureLocation: string;
  arrivalLocation: string;
  departureDate: string;
  users: Vec<User>;
  createdAt: nat64;
  updatedAt: Opt<nat64>;
}>;

type FlightPayload = Record<{
  companyName: string;
  departureLocation: string;
  arrivalLocation: string;
  departureDate: string;
}>;

type UserPayload = Record<{
  name: string;
  email: string;
  age: nat64;
}>;

const flightStorage = new StableBTreeMap<string, Flight>(0, 44, 1024);
const userStorage = new StableBTreeMap<string, User>(1, 44, 1024);

$update;
export function createFlight(payload: FlightPayload): Result<Flight, string> {
  const flight: Flight = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    ...payload,
    owner: ic.caller(),
    users: [],
  };

  flightStorage.insert(flight.id, flight);
  return Result.Ok(flight);
}

$query;
export function getFlight(id: string): Result<Flight, string> {
  return match(flightStorage.get(id), {
    Some: (flight) => Result.Ok<Flight, string>(flight),
    None: () => Result.Err<Flight, string>(`Flight with id=${id} not found.`),
  });
}

$update;
export function updateFlight(
  id: string,
  payload: FlightPayload
): Result<Flight, string> {
  return match(flightStorage.get(id), {
    Some: (existingFlight) => {
      const updatedFlight: Flight = {
        ...existingFlight,
        ...payload,
        updatedAt: Opt.Some(ic.time()),
      };

      flightStorage.insert(updatedFlight.id, updatedFlight);
      return Result.Ok<Flight, string>(updatedFlight);
    },
    None: () => Result.Err<Flight, string>(`Flight with id=${id} not found.`),
  });
}

$update;
export function deleteFlight(id: string): Result<Flight, string> {
  return match(flightStorage.get(id), {
    Some: (existingFlight) => {
      flightStorage.remove(id);
      return Result.Ok<Flight, string>(existingFlight);
    },
    None: () => Result.Err<Flight, string>(`Flight with id=${id} not found.`),
  });
}

$update;
export function bookFlight(id: string, userId: string): Result<Flight, string> {
  return match(flightStorage.get(id), {
    Some: (flight) => {
      // Assuming user exists and can be retrieved based on userId
      return match(userStorage.get(userId), {
        Some: (user) => {
          flight.users.push(user);
          flightStorage.insert(id, flight);
          return Result.Ok<Flight, string>(flight);
        },
        None: () => Result.Err<Flight, string>(`User with id=${userId} not found.`),
      });
    },
    None: () => Result.Err<Flight, string>(`Flight with id=${id} not found.`),
  });
}

$update;
export function createUser(payload: UserPayload): Result<User, string> {
  const user: User = {
    id: uuidv4(),
    createdAt: ic.time(),
    updatedAt: Opt.None,
    ...payload,
  };

  userStorage.insert(user.id, user);
  return Result.Ok<User, string>(user);
}

$query;
export function getUser(id: string): Result<User, string> {
  return match(userStorage.get(id), {
    Some: (user) => Result.Ok<User, string>(user),
    None: () => Result.Err<User, string>(`User with id = ${id} not found.`),
  });
}

$update;
export function deleteUser(id: string): Result<User, string> {
  return match(userStorage.get(id), {
    Some: (user) => {
      userStorage.remove(id);
      return Result.Ok<User, string>(user);
    },
    None: () => Result.Err<User, string>(`User with id = ${id} not found.`),
  });
}

$update;
export function updateUser(id: string, payload: UserPayload): Result<User, string> {
  return match(userStorage.get(id), {
    Some: (existingUser) => {
      const updatedUser: User = {
        ...existingUser,
        ...payload,
        updatedAt: Opt.Some(ic.time()),
      };

      userStorage.insert(id, updatedUser);
      return Result.Ok<User, string>(updatedUser);
    },
    None: () => Result.Err<User, string>(`User with id = ${id} not found.`),
  });
}


globalThis.crypto = {
  //@ts-ignore
  getRandomValues: () => {
    let array = new Uint8Array(32);

    for (let i = 0; i < array.length; i++) {
      array[i] = Math.floor(Math.random() * 256);
    }

    return array;
  },
};