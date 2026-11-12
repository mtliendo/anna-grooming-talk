import { ensureSchema, sql } from "@/lib/db";
import { SAMPLE_DOG } from "@/lib/services";
import type { Dog } from "@/lib/types";

type DogRow = {
  id: string;
  user_sub: string;
  name: string;
  breed: string;
  notes: string | null;
  created_at: string;
};

function mapDog(row: DogRow): Dog {
  return {
    id: row.id,
    userSub: row.user_sub,
    name: row.name,
    breed: row.breed,
    notes: row.notes,
    createdAt: row.created_at,
  };
}

export async function listDogs(userSub: string): Promise<Dog[]> {
  await ensureSchema();
  const rows = await sql`
    select id, user_sub, name, breed, notes, created_at::text
    from dogs
    where user_sub = ${userSub}
    order by created_at desc
  `;
  return (rows as DogRow[]).map(mapDog);
}

export async function addDog(
  userSub: string,
  input: { name: string; breed: string; notes?: string },
): Promise<Dog> {
  await ensureSchema();
  const rows = await sql`
    insert into dogs (user_sub, name, breed, notes)
    values (${userSub}, ${input.name.trim()}, ${input.breed.trim()}, ${input.notes?.trim() || null})
    returning id, user_sub, name, breed, notes, created_at::text
  `;
  return mapDog(rows[0] as DogRow);
}

export async function addSampleDog(userSub: string): Promise<Dog> {
  return addDog(userSub, SAMPLE_DOG);
}

export async function getDog(
  userSub: string,
  dogId: string,
): Promise<Dog | null> {
  await ensureSchema();
  const rows = await sql`
    select id, user_sub, name, breed, notes, created_at::text
    from dogs
    where user_sub = ${userSub} and id = ${dogId}
  `;
  return rows[0] ? mapDog(rows[0] as DogRow) : null;
}

export async function findDogByName(
  userSub: string,
  name: string,
): Promise<Dog | null> {
  await ensureSchema();
  const rows = await sql`
    select id, user_sub, name, breed, notes, created_at::text
    from dogs
    where user_sub = ${userSub} and lower(name) = lower(${name.trim()})
    limit 1
  `;
  return rows[0] ? mapDog(rows[0] as DogRow) : null;
}

export async function deleteDog(userSub: string, dogId: string): Promise<void> {
  await ensureSchema();
  await sql`delete from appointments where user_sub = ${userSub} and dog_id = ${dogId}`;
  await sql`delete from dogs where user_sub = ${userSub} and id = ${dogId}`;
}
