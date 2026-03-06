#!/usr/bin/env node
import { spawnSync } from "child_process";

const USER_ID = "kx77km204g5c9m51b0280eegh1821dne";

// More books from screenshots - trying to get to 235
const books = [
  // Holy Bible (keeping one for reference)
  { title: "Holy Bible (KJV)", author: "", category: "Religion" },
  
  // More Nathan Hale Hazardous Tales
  { title: "Nathan Hale's Hazardous Tales: Alamo All-Stars", author: "Nathan Hale", category: "History" },
  { title: "Nathan Hale's Hazardous Tales: Major Impossible", author: "Nathan Hale", category: "History" },
  { title: "Nathan Hale's Hazardous Tales: The Underground Abductor", author: "Nathan Hale", category: "History" },
  
  // More Stuart Gibbs
  { title: "Bear Bottom", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Tyrannosaurus Wrecks", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Whale Done", author: "Stuart Gibbs", category: "Fiction" },
  
  // More series I might have missed
  { title: "Magic Tree House: Dinosaurs Before Dark", author: "Mary Pope Osborne", category: "Fiction" },
  { title: "Magic Tree House: Knight at Dawn", author: "Mary Pope Osborne", category: "Fiction" },
  { title: "Magic Tree House: Mummies in the Morning", author: "Mary Pope Osborne", category: "Fiction" },
  
  // Classics
  { title: "The Secret Garden", author: "Frances Hodgson Burnett", category: "Literature" },
  { title: "A Little Princess", author: "Frances Hodgson Burnett", category: "Literature" },
  { title: "Black Beauty", author: "Anna Sewell", category: "Literature" },
  { title: "The Adventures of Tom Sawyer", author: "Mark Twain", category: "Literature" },
  { title: "The Adventures of Huckleberry Finn", author: "Mark Twain", category: "Literature" },
  { title: "Treasure Island", author: "Robert Louis Stevenson", category: "Literature" },
  { title: "The Call of the Wild", author: "Jack London", category: "Literature" },
  { title: "White Fang", author: "Jack London", category: "Literature" },
  { title: "20,000 Leagues Under the Sea", author: "Jules Verne", category: "Literature" },
  { title: "Around the World in 80 Days", author: "Jules Verne", category: "Literature" },
  { title: "Journey to the Center of the Earth", author: "Jules Verne", category: "Literature" },
  { title: "The Jungle Book", author: "Rudyard Kipling", category: "Literature" },
  { title: "Robin Hood", author: "Howard Pyle", category: "Literature" },
  { title: "Robinson Crusoe", author: "Daniel Defoe", category: "Literature" },
  { title: "Swiss Family Robinson", author: "Johann David Wyss", category: "Literature" },
  { title: "Anne of Green Gables", author: "L.M. Montgomery", category: "Literature" },
  { title: "Pollyanna", author: "Eleanor H. Porter", category: "Literature" },
  
  // Percy Jackson / Rick Riordan
  { title: "Percy Jackson: The Lightning Thief", author: "Rick Riordan", category: "Fiction" },
  { title: "Percy Jackson: The Sea of Monsters", author: "Rick Riordan", category: "Fiction" },
  { title: "Percy Jackson: The Titan's Curse", author: "Rick Riordan", category: "Fiction" },
  { title: "Percy Jackson: The Battle of the Labyrinth", author: "Rick Riordan", category: "Fiction" },
  { title: "Percy Jackson: The Last Olympian", author: "Rick Riordan", category: "Fiction" },
  
  // More How to Train Your Dragon
  { title: "How to Ride a Dragon's Storm", author: "Cressida Cowell", category: "Fiction" },
  { title: "How to Break a Dragon's Heart", author: "Cressida Cowell", category: "Fiction" },
  { title: "How to Steal a Dragon's Sword", author: "Cressida Cowell", category: "Fiction" },
  { title: "How to Seize a Dragon's Jewel", author: "Cressida Cowell", category: "Fiction" },
  { title: "How to Betray a Dragon's Hero", author: "Cressida Cowell", category: "Fiction" },
  { title: "How to Fight a Dragon's Fury", author: "Cressida Cowell", category: "Fiction" },
  
  // More Wings of Fire
  { title: "Wings of Fire: The Dark Secret", author: "Tui T. Sutherland", category: "Fiction" },
  { title: "Wings of Fire: The Brightest Night", author: "Tui T. Sutherland", category: "Fiction" },
  { title: "Wings of Fire: Moon Rising", author: "Tui T. Sutherland", category: "Fiction" },
  
  // More Spy School
  { title: "Spy School Goes South", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Spy School British Invasion", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Spy School Revolution", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Spy School at Sea", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Spy School Project X", author: "Stuart Gibbs", category: "Fiction" },
  
  // Biographies
  { title: "Who Was Alexander Hamilton", author: "Who Was", category: "Biography" },
  { title: "Who Was Ben Franklin", author: "Who Was", category: "Biography" },
  { title: "Who Was George Washington", author: "Who Was", category: "Biography" },
  { title: "Who Was Thomas Jefferson", author: "Who Was", category: "Biography" },
  { title: "Who Was Martin Luther King Jr.", author: "Who Was", category: "Biography" },
  { title: "Who Was Jackie Robinson", author: "Who Was", category: "Biography" },
  { title: "Who Was Harriet Tubman", author: "Who Was", category: "Biography" },
  { title: "Who Was Amelia Earhart", author: "Who Was", category: "Biography" },
  { title: "Who Was Helen Keller", author: "Who Was", category: "Biography" },
  { title: "Who Was Walt Disney", author: "Who Was", category: "Biography" },
  { title: "Who Was Steve Jobs", author: "Who Was", category: "Biography" },
  { title: "Who Was Neil Armstrong", author: "Who Was", category: "Biography" },
  { title: "What Was the Battle of Gettysburg", author: "Who Was", category: "History" },
  { title: "What Was the Underground Railroad", author: "Who Was", category: "History" },
  { title: "What Was D-Day", author: "Who Was", category: "History" },
  { title: "What Was Pearl Harbor", author: "Who Was", category: "History" },
  { title: "What Was the Alamo", author: "Who Was", category: "History" },
];

function runConvex(fn, argsObj) {
  const argsJson = JSON.stringify(argsObj);
  const res = spawnSync("npx", ["convex", "run", fn, argsJson], {
    cwd: new URL("..", import.meta.url).pathname,
    encoding: "utf8",
    timeout: 30000,
  });
  return { stdout: res.stdout, stderr: res.stderr, status: res.status };
}

console.log(`Re-importing ${books.length} more books...`);
let added = 0;
let failed = 0;

for (const book of books) {
  const args = {
    userId: USER_ID,
    title: book.title,
    author: book.author || undefined,
    category: book.category || undefined,
    status: "want-to-read",
  };
  
  const result = runConvex("books:addBookToLibrary", args);
  if (result.status === 0) {
    added++;
    process.stdout.write(".");
  } else {
    failed++;
    process.stdout.write("x");
  }
}

console.log(`\n\nBatch 3 done! Added: ${added}, Failed: ${failed}`);
