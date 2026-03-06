#!/usr/bin/env node
import { spawnSync } from "child_process";

const USER_ID = "kx77km204g5c9m51b0280eegh1821dne";

// Books extracted from Corinne's screenshots (Mar 5, 2026)
const books = [
  // Screenshot 1
  { title: "A Grimm Warning", author: "Chris Colfer", category: "Fiction" },
  { title: "A Kids Guide to Manners", author: "", category: "Life Skills" },
  { title: "Abraham Lincoln", author: "DK Biography", category: "Biography" },
  { title: "Aesop's Fables", author: "", category: "Literature" },
  { title: "Albert Einstein", author: "DK Biography", category: "Biography" },
  { title: "Alexander Hamilton: The Outsider", author: "Jean Fritz", category: "Biography" },
  { title: "All Creatures Great and Small", author: "James Herriot", category: "Literature" },
  { title: "Amelia Earhart", author: "DK Biography", category: "Biography" },
  { title: "Americas History Vol 2", author: "Enduring Vision", category: "History" },
  { title: "An Author's Odyssey", author: "Chris Colfer", category: "Fiction" },
  { title: "Ancient Art of Origami", author: "", category: "Art" },
  { title: "Anne Frank's Diary", author: "Anne Frank", category: "Biography" },
  { title: "Astrophysics for Young People in a Hurry", author: "Neil deGrasse Tyson", category: "Science" },
  { title: "Be the Boss of Your Stuff", author: "Allie Casazza", category: "Life Skills" },
  { title: "Bear Grylls Survival Guide", author: "Bear Grylls", category: "Skills" },
  { title: "Becoming Muhammad Ali", author: "James Patterson & Kwame Alexander", category: "Biography" },
  { title: "Belly Up", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Beyond the Kingdoms", author: "Chris Colfer", category: "Fiction" },
  { title: "Big Bad Ironclad", author: "Nathan Hale", category: "History" },
  { title: "Big Game", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Big History Timeline Book", author: "", category: "History" },
  { title: "Blades of Freedom", author: "Nathan Hale", category: "History" },
  { title: "Blood and Guts", author: "Linda Allison", category: "Science" },
  { title: "Blood and Guts: Human Body", author: "", category: "Science" },
  { title: "Brains On Its Alive", author: "", category: "Science" },
  
  // Screenshot 2
  { title: "Bunny vs Monkey", author: "Jamie Smart", category: "Fiction" },
  { title: "Bushcraft Kid", author: "Conrad Presley", category: "Skills" },
  { title: "By the Great Horn Spoon", author: "Sid Fleischman", category: "Fiction" },
  { title: "Captivating Stories for Curious Kids", author: "", category: "Fiction" },
  { title: "Carry On, Mr. Bowditch", author: "Jean Lee Latham", category: "Biography" },
  { title: "CatStronauts: Mission Moon", author: "Drew Brockington", category: "Fiction" },
  { title: "CatStronauts: Race to Mars", author: "Drew Brockington", category: "Fiction" },
  { title: "CatStronauts: Robot Rescue", author: "Drew Brockington", category: "Fiction" },
  { title: "CatStronauts: Space Station Situation", author: "Drew Brockington", category: "Fiction" },
  { title: "Charlotte's Web", author: "E.B. White", category: "Literature" },
  { title: "Choose to Matter", author: "Julie Foudy", category: "Biography" },
  { title: "Cold War Correspondent", author: "Nathan Hale", category: "History" },
  { title: "Crispin: The Cross of Lead", author: "Avi", category: "Fiction" },
  { title: "Crooked Castle", author: "AJ Vanderhorst", category: "Fiction" },
  { title: "D'Aulaires' Book of Greek Myths", author: "Ingri & Edgar d'Aulaire", category: "Mythology" },
  { title: "Diary of a Wimpy Kid: Hard Luck", author: "Jeff Kinney", category: "Fiction" },
  { title: "Diary of an Awesome Friendly Kid", author: "Jeff Kinney", category: "Fiction" },
  { title: "Dog Man", author: "Dav Pilkey", category: "Fiction" },
  { title: "Dog Man and Cat Kid", author: "Dav Pilkey", category: "Fiction" },
  { title: "Dog Man Unleashed", author: "Dav Pilkey", category: "Fiction" },
  { title: "Dog Man: A Tale of Two Kitties", author: "Dav Pilkey", category: "Fiction" },
  { title: "Dog Man: Lord of the Fleas", author: "Dav Pilkey", category: "Fiction" },
  { title: "Donner Dinner Party", author: "Nathan Hale", category: "History" },
  
  // Screenshot 3
  { title: "Encyclopedia of Everything", author: "", category: "Reference" },
  { title: "Ender's Game", author: "Orson Scott Card", category: "Fiction" },
  { title: "Evil Spy School", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Eyewitness Shakespeare", author: "", category: "Literature" },
  { title: "Great Battles for Boys - American Revolution", author: "Joe Giorello", category: "History" },
  { title: "Greeking Out", author: "", category: "Mythology" },
  { title: "Growth Mindset Activities for Kids", author: "", category: "Life Skills" },
  { title: "Guts & Glory: The American Revolution", author: "Ben Thompson", category: "History" },
  { title: "Harriet Tubman", author: "Ann Petry", category: "Biography" },
  { title: "Harry Potter and the Chamber of Secrets", author: "J.K. Rowling", category: "Fiction" },
  { title: "Harry Potter and the Goblet of Fire", author: "J.K. Rowling", category: "Fiction" },
  { title: "Harry Potter and the Half-Blood Prince", author: "J.K. Rowling", category: "Fiction" },
  { title: "Harry Potter and the Order of the Phoenix", author: "J.K. Rowling", category: "Fiction" },
  { title: "Harry Potter and the Prisoner of Azkaban", author: "J.K. Rowling", category: "Fiction" },
  { title: "Harry Potter and the Sorcerer's Stone", author: "J.K. Rowling", category: "Fiction" },
  { title: "Heidi", author: "Johanna Spyri", category: "Literature" },
  { title: "History Comics: World War II", author: "", category: "History" },
  { title: "History Mystery Kids: Fiasco in Florida", author: "Daniel Kenney", category: "Fiction" },
  { title: "History Year by Year", author: "DK", category: "History" },
  { title: "How to Be a Person", author: "Catherine Newman", category: "Life Skills" },
  { title: "How to Be a Pirate", author: "Cressida Cowell", category: "Fiction" },
  { title: "How to Cheat a Dragon's Curse", author: "Cressida Cowell", category: "Fiction" },
  { title: "How to Speak Dragonese", author: "Cressida Cowell", category: "Fiction" },
  { title: "How to Teach Children Shakespeare", author: "Ken Ludwig", category: "Education" },
  
  // Screenshot 4
  { title: "How to Train Your Dragon", author: "Cressida Cowell", category: "Fiction" },
  { title: "How to Twist a Dragon's Tale", author: "Cressida Cowell", category: "Fiction" },
  { title: "I Survived Hurricane Katrina", author: "Lauren Tarshis", category: "Fiction" },
  { title: "I Survived the Bombing of Pearl Harbor", author: "Lauren Tarshis", category: "Fiction" },
  { title: "I Survived the San Francisco Earthquake", author: "Lauren Tarshis", category: "Fiction" },
  { title: "I Survived the Shark Attacks of 1916", author: "Lauren Tarshis", category: "Fiction" },
  { title: "I Survived the Sinking of the Titanic", author: "Lauren Tarshis", category: "Fiction" },
  { title: "I Survived: The Great Chicago Fire", author: "Lauren Tarshis", category: "Fiction" },
  { title: "In Search of a Homeland", author: "Penelope Lively", category: "Mythology" },
  { title: "In Your Own Backyard", author: "Collier's Junior Classics", category: "Literature" },
  { title: "InvestiGators", author: "John Patrick Green", category: "Fiction" },
  { title: "InvestiGators: Ants in Our P.A.N.T.S.", author: "John Patrick Green", category: "Fiction" },
  { title: "InvestiGators: Off the Hook", author: "John Patrick Green", category: "Fiction" },
  { title: "InvestiGators: Take the Plunge", author: "John Patrick Green", category: "Fiction" },
  { title: "Investing for Kids", author: "Robert Kiyosaki", category: "Financial" },
  { title: "Jag Alskar Dig", author: "", category: "Language" },
  { title: "Just Around The Corner", author: "Collier's Junior Classics", category: "Literature" },
  { title: "Kids Guide to Exploring Nature", author: "", category: "Science" },
  { title: "Kids Herb Book", author: "", category: "Science" },
  { title: "King Arthur", author: "Classic Starts", category: "Literature" },
  { title: "Lafayette!", author: "Nathan Hale", category: "History" },
  { title: "Legends of Long Ago", author: "Collier's Junior Classics", category: "Literature" },
  { title: "Leon Garfield's Shakespeare Stories", author: "Leon Garfield", category: "Literature" },
  { title: "LIFE: Birds", author: "", category: "Science" },
  { title: "Lion Down", author: "Stuart Gibbs", category: "Fiction" },
  { title: "Little Britches", author: "Ralph Moody", category: "Literature" },
  { title: "Little Women", author: "Louisa May Alcott", category: "Literature" },
  { title: "Lord of the Flies", author: "William Golding", category: "Literature" },
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

console.log(`Re-importing ${books.length} books...`);
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
    console.log(`✓ ${book.title}`);
  } else {
    failed++;
    console.log(`✗ ${book.title}: ${result.stderr?.slice(0, 100)}`);
  }
}

console.log(`\nDone! Added: ${added}, Failed: ${failed}`);
