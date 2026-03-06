#!/usr/bin/env node
import { spawnSync } from "child_process";

const USER_ID = "kx77km204g5c9m51b0280eegh1821dne";

// More books from the latest screenshots I missed
const books = [
  // Science Comics series
  { title: "Science Comics: Bats", author: "Falynn Koch", category: "Science" },
  { title: "Science Comics: Dinosaurs", author: "MK Reed", category: "Science" },
  { title: "Science Comics: Flying Machines", author: "Alison Wilgus", category: "Science" },
  { title: "Science Comics: The Brain", author: "Tory Woollcott", category: "Science" },
  { title: "Science Comics: Volcanoes", author: "Jon Chad", category: "Science" },
  
  // Rowley Jefferson
  { title: "Rowley Jefferson's Awesome Friendly Adventure", author: "Jeff Kinney", category: "Fiction" },
  { title: "Rowley Jefferson's Awesome Friendly Spooky Stories", author: "Jeff Kinney", category: "Fiction" },
  
  // Brian Jacques Redwall
  { title: "Salamandastron", author: "Brian Jacques", category: "Fiction" },
  
  // Bear Grylls Adventures
  { title: "The Blizzard Challenge", author: "Bear Grylls", category: "Fiction" },
  { title: "The Desert Challenge", author: "Bear Grylls", category: "Fiction" },
  { title: "The Sea Challenge", author: "Bear Grylls", category: "Fiction" },
  { title: "The Jungle Challenge", author: "Bear Grylls", category: "Fiction" },
  
  // More Rick Riordan
  { title: "The Hammer of Thor", author: "Rick Riordan", category: "Fiction" },
  { title: "The Red Pyramid", author: "Rick Riordan", category: "Fiction" },
  { title: "The Serpent's Shadow", author: "Rick Riordan", category: "Fiction" },
  { title: "The Ship of the Dead", author: "Rick Riordan", category: "Fiction" },
  { title: "The Sword of Summer", author: "Rick Riordan", category: "Fiction" },
  { title: "The Throne of Fire", author: "Rick Riordan", category: "Fiction" },
  { title: "Magnus Chase and the Gods of Asgard", author: "Rick Riordan", category: "Fiction" },
  
  // Magic Misfits
  { title: "The Magic Misfits", author: "Neil Patrick Harris", category: "Fiction" },
  { title: "The Magic Misfits 2: The Second Story", author: "Neil Patrick Harris", category: "Fiction" },
  { title: "The Magic Misfits 3: The Minor Third", author: "Neil Patrick Harris", category: "Fiction" },
  { title: "The Magic Misfits 4: The Fourth Suit", author: "Neil Patrick Harris", category: "Fiction" },
  
  // More classics and others
  { title: "Surely You're Joking, Mr. Feynman!", author: "Richard Feynman", category: "Biography" },
  { title: "Story of Doctor Doolittle", author: "Hugh Lofting", category: "Fiction" },
  { title: "Swedish Fairy Tales", author: "John Bauer", category: "Literature" },
  { title: "Tales from Japan", author: "Helen & William McAlpine", category: "Literature" },
  { title: "The 7 Habits of Happy Kids", author: "Sean Covey", category: "Life Skills" },
  { title: "The Book of Virtues for Young People", author: "William J. Bennett", category: "Literature" },
  { title: "The Boxcar Children", author: "Gertrude Chandler Warner", category: "Fiction" },
  { title: "The Bronze Bow", author: "Elizabeth George Speare", category: "Fiction" },
  { title: "The Door in the Wall", author: "Marguerite de Angeli", category: "Fiction" },
  { title: "The Explorer", author: "Katherine Rundell", category: "Fiction" },
  { title: "The First Cat in Space Ate Pizza", author: "Mac Barnett", category: "Fiction" },
  { title: "The Golden Book History of the United States", author: "Earl Schenck Miers", category: "History" },
  { title: "The Guinea Pigs of Brierley Bramble", author: "J.P. Stringer", category: "Fiction" },
  { title: "The Jinx of Payrock Canyon", author: "Troy Nesbit", category: "Fiction" },
  { title: "The Lost Library", author: "", category: "Fiction" },
  { title: "The Mystery at Rustlers' Fort", author: "Troy Nesbit", category: "Fiction" },
  { title: "The Sign of the Beaver", author: "Elizabeth George Speare", category: "Fiction" },
  { title: "The Trumpet of the Swan", author: "E.B. White", category: "Literature" },
  { title: "The Wolf Wilder", author: "Katherine Rundell", category: "Fiction" },
  { title: "The Yellow House Mystery", author: "Gertrude Chandler Warner", category: "Fiction" },
  { title: "Time Traveler's Wife", author: "Audrey Niffenegger", category: "Fiction" },
  { title: "Tracker", author: "Gary Paulsen", category: "Fiction" },
  { title: "Treasury of Egyptian Mythology", author: "Donna Jo Napoli", category: "Mythology" },
  { title: "Treasury of Greek Mythology", author: "Donna Jo Napoli", category: "Mythology" },
  { title: "Surprise Island", author: "Gertrude Chandler Warner", category: "Fiction" },
  { title: "See Inside Your Body", author: "Usborne", category: "Science" },
  { title: "Understood Betsy", author: "Dorothy Canfield Fisher", category: "Literature" },
  { title: "Way of the Warrior Kid 4: Field Manual", author: "Jocko Willink", category: "Fiction" },
  { title: "What We See in the Stars", author: "Kelsey Oseid", category: "Science" },
  { title: "Wheelnuts: Deep Sea Dash", author: "Knife & Packer", category: "Fiction" },
  { title: "Wheelnuts: Rain Forest Rumble", author: "Knife & Packer", category: "Fiction" },
  { title: "Where the Red Fern Grows", author: "Wilson Rawls", category: "Literature" },
  { title: "Who Were the Tuskegee Airmen", author: "Who Was", category: "History" },
  { title: "Wilderness Survival Guide for Kids", author: "", category: "Skills" },
  { title: "Worlds Collide", author: "Chris Colfer", category: "Fiction" },
  { title: "Raid of No Return", author: "Nathan Hale", category: "History" },
  { title: "Romans", author: "Usborne", category: "History" },
  { title: "Tuttle Twins Free Market Rules", author: "Connor Boyack", category: "Civics" },
  { title: "Tuttle Twins Learn About the Law", author: "Connor Boyack", category: "Civics" },
  { title: "Tuttle Twins and the Fate of the Future", author: "Connor Boyack", category: "Civics" },
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

console.log(`Adding ${books.length} more books...`);
let added = 0;
for (const book of books) {
  const args = {
    userId: USER_ID,
    title: book.title,
    author: book.author || undefined,
    category: book.category || undefined,
    status: "want-to-read",
  };
  const result = runConvex("books:addBookToLibrary", args);
  if (result.status === 0) added++;
  process.stdout.write(".");
}
console.log(`\nBatch 4 done! Added: ${added}`);
