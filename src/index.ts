// Import necessary modules and types from external libraries
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

// Define the User and Flight data structures using Records
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

// Define payload types for creating Users and Flights
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

// Create storage instances for flights and users using StableBTreeMap
const flightStorage = new StableBTreeMap<string, Flight>(0, 44, 1024);
const userStorage = new StableBTreeMap<string, User>(1, 44, 1024);

// Function to create a new Flight
$update;
export function createFlight(payload: FlightPayload): Result<Flight, string> {
  // Validate the payload before processing it
  if (!payload.companyName || !payload.departureLocation || !payload.arrivalLocation || !payload.departureDate) {
    return Result.Err("Missing required fields in payload");
  }

  try {
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
  } catch (error) {
    return Result.Err("Failed to create flight");
  }
}

// Function to get a Flight by its ID
$query;
export function getFlight(id: string): Result<Flight, string> {
  try {
    const flight = flightStorage.get(id);
    if (!flight) {
      return Result.Err(`Flight with id=${id} not found.`);
    }
    return Result.Ok<Flight, string>(flight);
  } catch (error) {
    return Result.Err(`Error retrieving flight with id=${id}: ${error}`);
  }
}

// Function to get all Flights
$query;
export function getAllFlights(): Result<Vec<Flight>, string> {
  try {
    return Result.Ok(flightStorage.values());
  } catch (error) {
    return Result.Err("An error occurred while retrieving flights.");
  }
}

// Function to update an existing Flight
$update;
export function updateFlight(
  id: string,
  payload: FlightPayload
): Result<Flight, string> {
  // Validate the payload before processing it
  if (!payload.companyName || !payload.departureLocation || !payload.arrivalLocation || !payload.departureDate) {
    return Result.Err("Missing required fields in payload");
  }

  try {
    const existingFlight = flightStorage.get(id);
    if (!existingFlight) {
      return Result.Err(`Flight with id=${id} not found.`);
    }

    const updatedFlight: Flight = {
      id: existingFlight.id,
      owner: existingFlight.owner,
      companyName: payload.companyName,
      departureLocation: payload.departureLocation,
      arrivalLocation: payload.arrivalLocation,
      departureDate: payload.departureDate,
      users: existingFlight.users,
      createdAt: existingFlight.createdAt,
      updatedAt: Opt.Some(ic.time()),
    };

    flightStorage.insert(updatedFlight.id, updatedFlight);
    return Result.Ok<Flight, string>(updatedFlight);
  } catch (error) {
    return Result.Err(`Error updating flight with id=${id}: ${error}`);
  }
}

// Function to delete a Flight by its ID
$update;
export function deleteFlight(id: string): Result<Flight, string> {
  try {
    const existingFlight = flightStorage.get(id);
    if (!existingFlight) {
      return Result.Err(`Flight with id=${id} not found.`);
    }

    flightStorage.remove(id);
    return Result.Ok<Flight, string>(existingFlight);
  } catch (error) {
    return Result.Err(`Error deleting flight with id=${id}: ${error}`);
  }
}

// Function to book a Flight for a User
$update;
export function bookFlight(id: string, userId: string): Result<Flight, string> {
  try {
    const flight = flightStorage.get(id);
    if (!flight) {
      return Result.Err(`Flight with id=${id} not found.`);
    }

    const user = userStorage.get(userId);
    if (!user) {
      return Result.Err(`User with id=${userId} not found.`);
    }

    if (!flight.users.includes(user)) {
      flight.users.push(user);
      flight.updatedAt = Opt.Some(ic.time());
    }
    
    flightStorage.insert(id, flight);
    return Result.Ok<Flight, string>(flight);
  } catch (error) {
    return Result.Err(`Error booking flight with id=${id} for user with id=${userId}: ${error}`);
  }
}

// Function to create a new User
$update;
export function createUser(payload: UserPayload): Result<User, string> {
  // Validate the payload
  if (!payload.name || !payload.email || !payload.age) {
    return Result.Err<User, string>("Invalid payload");
  }

  try {
    const user: User = {
      id: uuidv4(),
      createdAt: ic.time(),
      updatedAt: Opt.None,
      ...payload,
    };

    userStorage.insert(user.id, user);
    return Result.Ok<User, string>(user);
  } catch (error) {
    return Result.Err(`Error creating user: ${error}`);
  }
}

// Function to get a User by their ID
$query;
export function getUser(id: string): Result<User, string> {
  try {
    const user = userStorage.get(id);
    if (!user) {
      return Result.Err<User, string>(`User with id = ${id} not found.`);
    }
    return Result.Ok<User, string>(user);
  } catch (error) {
    return Result.Err(`Error retrieving user with id=${id}: ${error}`);
  }
}

// Function to get all Users
$query;
export function getAllUsers(): Result<Vec<User>, string> {
  try {
    return Result.Ok(userStorage.values());
  } catch (error) {
    return Result.Err("An error occurred while retrieving users.");
  }
}

// Function to delete a User by their ID
$update;
export function deleteUser(id: string): Result<User, string> {
  try {
    const user = userStorage.get(id);
    if (!user) {
      return Result.Err<User, string>(`User with id = ${id} not found.`);
    }
    userStorage.remove(id);
    return Result.Ok<User, string>(user);
  } catch (error) {
    return Result.Err(`Error deleting user with id = ${id}: ${error}`);
  }
}

// Function to update an existing User
$update;
export function updateUser(id: string, payload: UserPayload): Result<User, string> {
  // Validate the payload
  if (!payload.name || !payload.email || !payload.age) {
    return Result.Err<User, string>("Invalid payload");
  }

  try {
    const existingUser = userStorage.get(id);
    if (!existingUser) {
      return Result.Err<User, string>(`User with id = ${id} not found.`);
    }

    const updatedUser: User = {
      id: existingUser.id,
      name: payload.name,
      email: payload.email,
      age: payload.age,
      createdAt: existingUser.createdAt,
      updatedAt: Opt.Some(ic.time()),
    };

    userStorage.insert(id, updatedUser);
    return Result.Ok<User, string>(updatedUser);
  } catch (error) {
    return Result.Err(`Error updating user with id = ${id}: ${error}`);
  }
}

// Add a crypto object to globalThis with a getRandomValues function
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
