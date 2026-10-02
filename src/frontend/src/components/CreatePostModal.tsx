import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import {
  useCreateCarouselPost,
  useCreatePost,
  useCreateStory,
} from "@/hooks/useQueries";
import { useStorageClient } from "@/hooks/useStorageClient";
import { useInternetIdentity } from "@caffeineai/core-infrastructure";
import {
  Film,
  HelpCircle,
  ImageIcon,
  Images,
  Music,
  Music2,
  Search,
  Sticker,
  Vote,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

// ---- Curated song library ----

type SongLanguage =
  | "Hindi"
  | "Punjabi"
  | "Tamil"
  | "Telugu"
  | "English"
  | "Other";

interface Song {
  id: string;
  title: string;
  artist: string;
  language: SongLanguage;
  duration: string;
}

const SONG_LIBRARY: Song[] = [
  // ── Bollywood / Hindi (53 songs) ─────────────────────────────────────────
  {
    id: "h001",
    title: "Kesariya",
    artist: "Arijit Singh",
    language: "Hindi",
    duration: "4:28",
  },
  {
    id: "h002",
    title: "Tere Hawaale",
    artist: "Arijit Singh & Shilpa Rao",
    language: "Hindi",
    duration: "5:02",
  },
  {
    id: "h003",
    title: "Channa Mereya",
    artist: "Arijit Singh",
    language: "Hindi",
    duration: "4:49",
  },
  {
    id: "h004",
    title: "Phir Bhi Tumko Chahunna",
    artist: "Arijit Singh",
    language: "Hindi",
    duration: "5:12",
  },
  {
    id: "h005",
    title: "Tum Hi Ho",
    artist: "Arijit Singh",
    language: "Hindi",
    duration: "4:22",
  },
  {
    id: "h006",
    title: "Ik Vaari Aa",
    artist: "Arijit Singh",
    language: "Hindi",
    duration: "4:35",
  },
  {
    id: "h007",
    title: "Tera Yaar Hoon Main",
    artist: "Arijit Singh",
    language: "Hindi",
    duration: "4:18",
  },
  {
    id: "h008",
    title: "Khairiyat",
    artist: "Arijit Singh",
    language: "Hindi",
    duration: "4:05",
  },
  {
    id: "h009",
    title: "Raataan Lambiyan",
    artist: "Jubin Nautiyal & Asees Kaur",
    language: "Hindi",
    duration: "3:43",
  },
  {
    id: "h010",
    title: "Lut Gaye",
    artist: "Jubin Nautiyal",
    language: "Hindi",
    duration: "3:29",
  },
  {
    id: "h011",
    title: "Tujhe Kitna Chahne Lage",
    artist: "Jubin Nautiyal",
    language: "Hindi",
    duration: "3:50",
  },
  {
    id: "h012",
    title: "Pehle Pyaar Ka",
    artist: "Jubin Nautiyal",
    language: "Hindi",
    duration: "4:05",
  },
  {
    id: "h013",
    title: "Teri Baaton Mein Aisa Uljha Jiya",
    artist: "Jubin Nautiyal",
    language: "Hindi",
    duration: "3:55",
  },
  {
    id: "h014",
    title: "O Humsafar",
    artist: "Neha Kakkar & Tony Kakkar",
    language: "Hindi",
    duration: "3:18",
  },
  {
    id: "h015",
    title: "Aankh Marey",
    artist: "Neha Kakkar & Mika Singh",
    language: "Hindi",
    duration: "3:25",
  },
  {
    id: "h016",
    title: "Dilbar Dilbar",
    artist: "Neha Kakkar",
    language: "Hindi",
    duration: "3:10",
  },
  {
    id: "h017",
    title: "Tera Suit",
    artist: "Tony Kakkar",
    language: "Hindi",
    duration: "3:22",
  },
  {
    id: "h018",
    title: "Lag Ja Gale",
    artist: "Lata Mangeshkar",
    language: "Hindi",
    duration: "3:45",
  },
  {
    id: "h019",
    title: "Aye Mere Watan Ke Logon",
    artist: "Lata Mangeshkar",
    language: "Hindi",
    duration: "5:20",
  },
  {
    id: "h020",
    title: "Ajeeb Dastan Hai Yeh",
    artist: "Lata Mangeshkar",
    language: "Hindi",
    duration: "4:10",
  },
  {
    id: "h021",
    title: "Tere Bina Zindagi Se Koi",
    artist: "Lata Mangeshkar & Kishore Kumar",
    language: "Hindi",
    duration: "5:05",
  },
  {
    id: "h022",
    title: "Roop Tera Mastana",
    artist: "Kishore Kumar",
    language: "Hindi",
    duration: "4:10",
  },
  {
    id: "h023",
    title: "Pal Pal Dil Ke Paas",
    artist: "Kishore Kumar",
    language: "Hindi",
    duration: "4:02",
  },
  {
    id: "h024",
    title: "Yeh Shaam Mastani",
    artist: "Kishore Kumar",
    language: "Hindi",
    duration: "3:48",
  },
  {
    id: "h025",
    title: "Aane Wala Pal",
    artist: "Kishore Kumar",
    language: "Hindi",
    duration: "4:15",
  },
  {
    id: "h026",
    title: "Dil Diyan Gallan",
    artist: "Atif Aslam",
    language: "Hindi",
    duration: "4:15",
  },
  {
    id: "h027",
    title: "Tere Sang Yaara",
    artist: "Atif Aslam",
    language: "Hindi",
    duration: "4:38",
  },
  {
    id: "h028",
    title: "Jeena Jeena",
    artist: "Atif Aslam",
    language: "Hindi",
    duration: "3:55",
  },
  {
    id: "h029",
    title: "Woh Lamhe",
    artist: "Atif Aslam",
    language: "Hindi",
    duration: "4:20",
  },
  {
    id: "h030",
    title: "Tu Jaane Na",
    artist: "Atif Aslam",
    language: "Hindi",
    duration: "4:30",
  },
  {
    id: "h031",
    title: "Teri Aankhon Mein",
    artist: "Shreya Ghoshal",
    language: "Hindi",
    duration: "3:42",
  },
  {
    id: "h032",
    title: "Sunn Raha Hai",
    artist: "Shreya Ghoshal & Ankit Tiwari",
    language: "Hindi",
    duration: "4:00",
  },
  {
    id: "h033",
    title: "Barso Re",
    artist: "Shreya Ghoshal",
    language: "Hindi",
    duration: "4:25",
  },
  {
    id: "h034",
    title: "Deewani Mastani",
    artist: "Shreya Ghoshal",
    language: "Hindi",
    duration: "3:50",
  },
  {
    id: "h035",
    title: "Deva Shree Ganesha",
    artist: "AR Rahman & Shankar Mahadevan",
    language: "Hindi",
    duration: "5:10",
  },
  {
    id: "h036",
    title: "Jai Ho",
    artist: "AR Rahman",
    language: "Hindi",
    duration: "5:35",
  },
  {
    id: "h037",
    title: "Khwaja Mere Khwaja",
    artist: "AR Rahman",
    language: "Hindi",
    duration: "6:10",
  },
  {
    id: "h038",
    title: "Tere Bina",
    artist: "AR Rahman & Chinmayi",
    language: "Hindi",
    duration: "5:40",
  },
  {
    id: "h039",
    title: "Afreen Afreen",
    artist: "Rahat Fateh Ali Khan & Momina Mustehsan",
    language: "Hindi",
    duration: "5:30",
  },
  {
    id: "h040",
    title: "O Re Piya",
    artist: "Rahat Fateh Ali Khan",
    language: "Hindi",
    duration: "4:45",
  },
  {
    id: "h041",
    title: "Tere Mast Mast Do Nain",
    artist: "Rahat Fateh Ali Khan",
    language: "Hindi",
    duration: "4:40",
  },
  {
    id: "h042",
    title: "Kala Chashma",
    artist: "Badshah ft. Aastha Gill",
    language: "Hindi",
    duration: "3:28",
  },
  {
    id: "h043",
    title: "Garmi",
    artist: "Badshah & Neha Kakkar",
    language: "Hindi",
    duration: "3:15",
  },
  {
    id: "h044",
    title: "Paani Paani",
    artist: "Badshah ft. Jacqueline Fernandez",
    language: "Hindi",
    duration: "3:05",
  },
  {
    id: "h045",
    title: "Lungi Dance",
    artist: "Yo Yo Honey Singh",
    language: "Hindi",
    duration: "3:45",
  },
  {
    id: "h046",
    title: "Ankhiyon Se Goli Marey",
    artist: "Udit Narayan",
    language: "Hindi",
    duration: "4:00",
  },
  {
    id: "h047",
    title: "Butta Bomma (Hindi)",
    artist: "Armaan Malik",
    language: "Hindi",
    duration: "3:40",
  },
  {
    id: "h048",
    title: "Bekhayali",
    artist: "Sachet Tandon",
    language: "Hindi",
    duration: "5:05",
  },
  {
    id: "h049",
    title: "Tera Ban Jaunga",
    artist: "Akhil Sachdeva & Tulsi Kumar",
    language: "Hindi",
    duration: "3:50",
  },
  {
    id: "h050",
    title: "Kabira",
    artist: "Tochi Raina & Rekha Bhardwaj",
    language: "Hindi",
    duration: "3:55",
  },
  {
    id: "h051",
    title: "Dard-E-Disco",
    artist: "Udit Narayan & Labh Janjua",
    language: "Hindi",
    duration: "3:30",
  },
  {
    id: "h052",
    title: "Kal Ho Naa Ho",
    artist: "Sonu Nigam",
    language: "Hindi",
    duration: "5:00",
  },
  {
    id: "h053",
    title: "Main Agar Kahoon",
    artist: "Sonu Nigam & Shreya Ghoshal",
    language: "Hindi",
    duration: "4:55",
  },

  // ── Punjabi (31 songs) ───────────────────────────────────────────────────
  {
    id: "p001",
    title: "Lover",
    artist: "Diljit Dosanjh",
    language: "Punjabi",
    duration: "3:05",
  },
  {
    id: "p002",
    title: "GOAT",
    artist: "Diljit Dosanjh",
    language: "Punjabi",
    duration: "3:20",
  },
  {
    id: "p003",
    title: "Do You Know",
    artist: "Diljit Dosanjh",
    language: "Punjabi",
    duration: "3:45",
  },
  {
    id: "p004",
    title: "5 Taara",
    artist: "Diljit Dosanjh",
    language: "Punjabi",
    duration: "3:30",
  },
  {
    id: "p005",
    title: "Ikk Kudi",
    artist: "Diljit Dosanjh",
    language: "Punjabi",
    duration: "4:05",
  },
  {
    id: "p006",
    title: "With You",
    artist: "AP Dhillon",
    language: "Punjabi",
    duration: "2:55",
  },
  {
    id: "p007",
    title: "Excuses",
    artist: "AP Dhillon & Gurinder Gill",
    language: "Punjabi",
    duration: "3:10",
  },
  {
    id: "p008",
    title: "Brown Munde",
    artist: "AP Dhillon",
    language: "Punjabi",
    duration: "3:22",
  },
  {
    id: "p009",
    title: "Nakhre",
    artist: "AP Dhillon",
    language: "Punjabi",
    duration: "2:48",
  },
  {
    id: "p010",
    title: "Insane",
    artist: "AP Dhillon & Diljit Dosanjh",
    language: "Punjabi",
    duration: "3:02",
  },
  {
    id: "p011",
    title: "295",
    artist: "Sidhu Moosewala",
    language: "Punjabi",
    duration: "4:10",
  },
  {
    id: "p012",
    title: "The Last Ride",
    artist: "Sidhu Moosewala",
    language: "Punjabi",
    duration: "4:20",
  },
  {
    id: "p013",
    title: "Legend",
    artist: "Sidhu Moosewala",
    language: "Punjabi",
    duration: "3:55",
  },
  {
    id: "p014",
    title: "So High",
    artist: "Sidhu Moosewala",
    language: "Punjabi",
    duration: "3:35",
  },
  {
    id: "p015",
    title: "SYL",
    artist: "Sidhu Moosewala",
    language: "Punjabi",
    duration: "4:48",
  },
  {
    id: "p016",
    title: "Elevated",
    artist: "Shubh",
    language: "Punjabi",
    duration: "3:00",
  },
  {
    id: "p017",
    title: "We Rollin",
    artist: "Shubh",
    language: "Punjabi",
    duration: "2:58",
  },
  {
    id: "p018",
    title: "No Love",
    artist: "Shubh",
    language: "Punjabi",
    duration: "3:12",
  },
  {
    id: "p019",
    title: "In Da Club",
    artist: "Shubh",
    language: "Punjabi",
    duration: "2:55",
  },
  {
    id: "p020",
    title: "Yaar Bolda",
    artist: "Karan Aujla",
    language: "Punjabi",
    duration: "3:20",
  },
  {
    id: "p021",
    title: "Chitta Kurta",
    artist: "Karan Aujla",
    language: "Punjabi",
    duration: "3:05",
  },
  {
    id: "p022",
    title: "Winning Speech",
    artist: "Karan Aujla",
    language: "Punjabi",
    duration: "3:40",
  },
  {
    id: "p023",
    title: "OG",
    artist: "Karan Aujla",
    language: "Punjabi",
    duration: "3:28",
  },
  {
    id: "p024",
    title: "Main Nahi Feenda",
    artist: "Karan Aujla",
    language: "Punjabi",
    duration: "3:15",
  },
  {
    id: "p025",
    title: "Viah",
    artist: "Ammy Virk",
    language: "Punjabi",
    duration: "3:50",
  },
  {
    id: "p026",
    title: "Qismat",
    artist: "Ammy Virk & Sargun Mehta",
    language: "Punjabi",
    duration: "4:00",
  },
  {
    id: "p027",
    title: "Naina De Naina",
    artist: "Ammy Virk",
    language: "Punjabi",
    duration: "3:42",
  },
  {
    id: "p028",
    title: "High Rated Gabru",
    artist: "Guru Randhawa",
    language: "Punjabi",
    duration: "3:15",
  },
  {
    id: "p029",
    title: "Lahore",
    artist: "Guru Randhawa",
    language: "Punjabi",
    duration: "3:25",
  },
  {
    id: "p030",
    title: "Ban Ja Rani",
    artist: "Guru Randhawa & Tulsi Kumar",
    language: "Punjabi",
    duration: "3:45",
  },
  {
    id: "p031",
    title: "Naach Meri Rani",
    artist: "Guru Randhawa ft. Nora Fatehi",
    language: "Punjabi",
    duration: "3:28",
  },

  // ── Tamil (20 songs) ─────────────────────────────────────────────────────
  {
    id: "t001",
    title: "Roja Janeman",
    artist: "AR Rahman",
    language: "Tamil",
    duration: "4:50",
  },
  {
    id: "t002",
    title: "Mustafa Mustafa",
    artist: "AR Rahman",
    language: "Tamil",
    duration: "4:30",
  },
  {
    id: "t003",
    title: "Enna Solla",
    artist: "AR Rahman",
    language: "Tamil",
    duration: "4:15",
  },
  {
    id: "t004",
    title: "Kaadhal Rojave",
    artist: "AR Rahman",
    language: "Tamil",
    duration: "4:20",
  },
  {
    id: "t005",
    title: "Vande Mataram (Tamil)",
    artist: "AR Rahman",
    language: "Tamil",
    duration: "5:00",
  },
  {
    id: "t006",
    title: "Kannazhaga",
    artist: "Anirudh Ravichander",
    language: "Tamil",
    duration: "3:50",
  },
  {
    id: "t007",
    title: "Why This Kolaveri Di",
    artist: "Anirudh Ravichander & Dhanush",
    language: "Tamil",
    duration: "3:42",
  },
  {
    id: "t008",
    title: "Naane Varuvean",
    artist: "Anirudh Ravichander",
    language: "Tamil",
    duration: "3:30",
  },
  {
    id: "t009",
    title: "Aalaporaan Tamizhan",
    artist: "Anirudh Ravichander",
    language: "Tamil",
    duration: "4:10",
  },
  {
    id: "t010",
    title: "Mersal Arasan",
    artist: "Anirudh Ravichander",
    language: "Tamil",
    duration: "4:05",
  },
  {
    id: "t011",
    title: "Butterfly",
    artist: "Anirudh Ravichander & Jonita Gandhi",
    language: "Tamil",
    duration: "3:55",
  },
  {
    id: "t012",
    title: "Arabic Kuthu",
    artist: "Anirudh Ravichander & Jonita Gandhi",
    language: "Tamil",
    duration: "3:40",
  },
  {
    id: "t013",
    title: "Kaattu Payale",
    artist: "Anirudh Ravichander",
    language: "Tamil",
    duration: "3:25",
  },
  {
    id: "t014",
    title: "Srivalli (Tamil)",
    artist: "Sid Sriram",
    language: "Tamil",
    duration: "3:45",
  },
  {
    id: "t015",
    title: "Daanam",
    artist: "Sid Sriram",
    language: "Tamil",
    duration: "4:00",
  },
  {
    id: "t016",
    title: "Mazhaiye Mazhaiye",
    artist: "Sid Sriram",
    language: "Tamil",
    duration: "3:52",
  },
  {
    id: "t017",
    title: "Rowdy Baby",
    artist: "Yuvan Shankar Raja & Dhee",
    language: "Tamil",
    duration: "3:35",
  },
  {
    id: "t018",
    title: "Kannaana Kanney",
    artist: "Dhibu Ninan Thomas",
    language: "Tamil",
    duration: "4:30",
  },
  {
    id: "t019",
    title: "Naatu Naatu (Tamil)",
    artist: "MM Keeravani",
    language: "Tamil",
    duration: "3:52",
  },
  {
    id: "t020",
    title: "Urvasi Urvasi",
    artist: "AR Rahman",
    language: "Tamil",
    duration: "4:00",
  },

  // ── Telugu (15 songs) ────────────────────────────────────────────────────
  {
    id: "te001",
    title: "Butta Bomma",
    artist: "Armaan Malik",
    language: "Telugu",
    duration: "3:40",
  },
  {
    id: "te002",
    title: "Srivalli",
    artist: "Sid Sriram",
    language: "Telugu",
    duration: "3:45",
  },
  {
    id: "te003",
    title: "Naatu Naatu (Telugu)",
    artist: "MM Keeravani",
    language: "Telugu",
    duration: "3:52",
  },
  {
    id: "te004",
    title: "Oo Antava",
    artist: "Indravathi Chauhan",
    language: "Telugu",
    duration: "3:28",
  },
  {
    id: "te005",
    title: "Saami Saami",
    artist: "Mounika Yadav",
    language: "Telugu",
    duration: "3:30",
  },
  {
    id: "te006",
    title: "Ramuloo Ramulaa",
    artist: "Mangli & Anurag Kulkarni",
    language: "Telugu",
    duration: "3:45",
  },
  {
    id: "te007",
    title: "Inkem Inkem Kaavaale",
    artist: "Sid Sriram",
    language: "Telugu",
    duration: "4:20",
  },
  {
    id: "te008",
    title: "Ye Mantramo Vinnava",
    artist: "Mickey J Meyer",
    language: "Telugu",
    duration: "4:10",
  },
  {
    id: "te009",
    title: "Nuvve Nuvve",
    artist: "Devi Sri Prasad",
    language: "Telugu",
    duration: "3:55",
  },
  {
    id: "te010",
    title: "Bang Bang Bang",
    artist: "Thaman S",
    language: "Telugu",
    duration: "3:25",
  },
  {
    id: "te011",
    title: "Jhummandi Naadam",
    artist: "MM Keeravani",
    language: "Telugu",
    duration: "4:30",
  },
  {
    id: "te012",
    title: "Daivame Daivame",
    artist: "Mickey J Meyer",
    language: "Telugu",
    duration: "4:00",
  },
  {
    id: "te013",
    title: "Vachadayyo Saami",
    artist: "Devi Sri Prasad",
    language: "Telugu",
    duration: "3:40",
  },
  {
    id: "te014",
    title: "Buttabomma Buttabomma",
    artist: "Devi Sri Prasad",
    language: "Telugu",
    duration: "3:50",
  },
  {
    id: "te015",
    title: "Nee Neeli Kannullo",
    artist: "SS Thaman",
    language: "Telugu",
    duration: "4:00",
  },

  // ── English / International (47 songs) ───────────────────────────────────
  {
    id: "e001",
    title: "Blinding Lights",
    artist: "The Weeknd",
    language: "English",
    duration: "3:22",
  },
  {
    id: "e002",
    title: "Save Your Tears",
    artist: "The Weeknd",
    language: "English",
    duration: "3:35",
  },
  {
    id: "e003",
    title: "Starboy",
    artist: "The Weeknd ft. Daft Punk",
    language: "English",
    duration: "3:50",
  },
  {
    id: "e004",
    title: "Can't Feel My Face",
    artist: "The Weeknd",
    language: "English",
    duration: "3:35",
  },
  {
    id: "e005",
    title: "Shape of You",
    artist: "Ed Sheeran",
    language: "English",
    duration: "3:54",
  },
  {
    id: "e006",
    title: "Perfect",
    artist: "Ed Sheeran",
    language: "English",
    duration: "4:23",
  },
  {
    id: "e007",
    title: "Shivers",
    artist: "Ed Sheeran",
    language: "English",
    duration: "3:27",
  },
  {
    id: "e008",
    title: "Bad Habits",
    artist: "Ed Sheeran",
    language: "English",
    duration: "3:51",
  },
  {
    id: "e009",
    title: "Anti-Hero",
    artist: "Taylor Swift",
    language: "English",
    duration: "3:20",
  },
  {
    id: "e010",
    title: "Shake It Off",
    artist: "Taylor Swift",
    language: "English",
    duration: "3:40",
  },
  {
    id: "e011",
    title: "Cruel Summer",
    artist: "Taylor Swift",
    language: "English",
    duration: "2:58",
  },
  {
    id: "e012",
    title: "Love Story",
    artist: "Taylor Swift",
    language: "English",
    duration: "3:55",
  },
  {
    id: "e013",
    title: "Bad Guy",
    artist: "Billie Eilish",
    language: "English",
    duration: "3:14",
  },
  {
    id: "e014",
    title: "Happier Than Ever",
    artist: "Billie Eilish",
    language: "English",
    duration: "4:58",
  },
  {
    id: "e015",
    title: "Therefore I Am",
    artist: "Billie Eilish",
    language: "English",
    duration: "2:54",
  },
  {
    id: "e016",
    title: "Peaches",
    artist: "Justin Bieber ft. Daniel Caesar",
    language: "English",
    duration: "3:18",
  },
  {
    id: "e017",
    title: "Stay",
    artist: "The Kid LAROI & Justin Bieber",
    language: "English",
    duration: "2:21",
  },
  {
    id: "e018",
    title: "Ghost",
    artist: "Justin Bieber",
    language: "English",
    duration: "2:33",
  },
  {
    id: "e019",
    title: "God's Plan",
    artist: "Drake",
    language: "English",
    duration: "3:18",
  },
  {
    id: "e020",
    title: "Rich Flex",
    artist: "Drake & 21 Savage",
    language: "English",
    duration: "4:00",
  },
  {
    id: "e021",
    title: "In My Feelings",
    artist: "Drake",
    language: "English",
    duration: "3:37",
  },
  {
    id: "e022",
    title: "Lose Yourself",
    artist: "Eminem",
    language: "English",
    duration: "5:26",
  },
  {
    id: "e023",
    title: "Without Me",
    artist: "Eminem",
    language: "English",
    duration: "4:50",
  },
  {
    id: "e024",
    title: "Rap God",
    artist: "Eminem",
    language: "English",
    duration: "6:04",
  },
  {
    id: "e025",
    title: "Butter",
    artist: "BTS",
    language: "English",
    duration: "2:44",
  },
  {
    id: "e026",
    title: "Dynamite",
    artist: "BTS",
    language: "English",
    duration: "3:19",
  },
  {
    id: "e027",
    title: "Permission to Dance",
    artist: "BTS",
    language: "English",
    duration: "3:05",
  },
  {
    id: "e028",
    title: "Levitating",
    artist: "Dua Lipa",
    language: "English",
    duration: "3:23",
  },
  {
    id: "e029",
    title: "New Rules",
    artist: "Dua Lipa",
    language: "English",
    duration: "3:29",
  },
  {
    id: "e030",
    title: "As It Was",
    artist: "Harry Styles",
    language: "English",
    duration: "2:37",
  },
  {
    id: "e031",
    title: "Watermelon Sugar",
    artist: "Harry Styles",
    language: "English",
    duration: "2:54",
  },
  {
    id: "e032",
    title: "Sunflower",
    artist: "Post Malone & Swae Lee",
    language: "English",
    duration: "2:38",
  },
  {
    id: "e033",
    title: "Rockstar",
    artist: "Post Malone ft. 21 Savage",
    language: "English",
    duration: "3:41",
  },
  {
    id: "e034",
    title: "Circles",
    artist: "Post Malone",
    language: "English",
    duration: "3:34",
  },
  {
    id: "e035",
    title: "Sicko Mode",
    artist: "Travis Scott",
    language: "English",
    duration: "5:12",
  },
  {
    id: "e036",
    title: "Leave The Door Open",
    artist: "Bruno Mars & Anderson .Paak",
    language: "English",
    duration: "4:02",
  },
  {
    id: "e037",
    title: "Uptown Funk",
    artist: "Bruno Mars & Mark Ronson",
    language: "English",
    duration: "4:30",
  },
  {
    id: "e038",
    title: "Treasure",
    artist: "Bruno Mars",
    language: "English",
    duration: "2:59",
  },
  {
    id: "e039",
    title: "Easy On Me",
    artist: "Adele",
    language: "English",
    duration: "3:44",
  },
  {
    id: "e040",
    title: "Hello",
    artist: "Adele",
    language: "English",
    duration: "4:55",
  },
  {
    id: "e041",
    title: "Believer",
    artist: "Imagine Dragons",
    language: "English",
    duration: "3:24",
  },
  {
    id: "e042",
    title: "Thunder",
    artist: "Imagine Dragons",
    language: "English",
    duration: "3:07",
  },
  {
    id: "e043",
    title: "Enemy",
    artist: "Imagine Dragons ft. JID",
    language: "English",
    duration: "2:34",
  },
  {
    id: "e044",
    title: "Heat Waves",
    artist: "Glass Animals",
    language: "English",
    duration: "3:59",
  },
  {
    id: "e045",
    title: "Industry Baby",
    artist: "Lil Nas X & Jack Harlow",
    language: "English",
    duration: "3:32",
  },
  {
    id: "e046",
    title: "Drivers License",
    artist: "Olivia Rodrigo",
    language: "English",
    duration: "4:02",
  },
  {
    id: "e047",
    title: "Good 4 U",
    artist: "Olivia Rodrigo",
    language: "English",
    duration: "2:58",
  },

  // ── Bhojpuri (10 songs) ──────────────────────────────────────────────────
  {
    id: "bh001",
    title: "Lollipop Lagelu",
    artist: "Pawan Singh",
    language: "Other",
    duration: "3:10",
  },
  {
    id: "bh002",
    title: "Piya Ke Gaon",
    artist: "Khesari Lal Yadav",
    language: "Other",
    duration: "3:45",
  },
  {
    id: "bh003",
    title: "Dil Ke Tukde",
    artist: "Pawan Singh",
    language: "Other",
    duration: "4:00",
  },
  {
    id: "bh004",
    title: "Patna Se Patna Tak",
    artist: "Ritesh Pandey",
    language: "Other",
    duration: "3:55",
  },
  {
    id: "bh005",
    title: "Jija Sali Ka Pyar",
    artist: "Khesari Lal Yadav",
    language: "Other",
    duration: "3:30",
  },
  {
    id: "bh006",
    title: "Tohre Karana",
    artist: "Pawan Singh",
    language: "Other",
    duration: "4:10",
  },
  {
    id: "bh007",
    title: "Tani Jhuk Ke Mar",
    artist: "Pawan Singh",
    language: "Other",
    duration: "3:20",
  },
  {
    id: "bh008",
    title: "Ae Raja Nai Aib",
    artist: "Khesari Lal Yadav",
    language: "Other",
    duration: "4:05",
  },
  {
    id: "bh009",
    title: "Champa Chameli",
    artist: "Ritesh Pandey",
    language: "Other",
    duration: "3:50",
  },
  {
    id: "bh010",
    title: "Goriya Ke Kamariya",
    artist: "Pawan Singh",
    language: "Other",
    duration: "3:25",
  },

  // ── Bengali (10 songs) ───────────────────────────────────────────────────
  {
    id: "bn001",
    title: "Ekla Cholo Re",
    artist: "Rabindranath Tagore",
    language: "Other",
    duration: "4:40",
  },
  {
    id: "bn002",
    title: "Amar Sonar Bangla",
    artist: "Rabindranath Tagore",
    language: "Other",
    duration: "4:55",
  },
  {
    id: "bn003",
    title: "Tomake Chai",
    artist: "Anupam Roy",
    language: "Other",
    duration: "4:20",
  },
  {
    id: "bn004",
    title: "Noy Noy Ei Meye",
    artist: "Nachiketa Chakraborty",
    language: "Other",
    duration: "4:00",
  },
  {
    id: "bn005",
    title: "Mon Majhi Re",
    artist: "Monali Thakur",
    language: "Other",
    duration: "5:00",
  },
  {
    id: "bn006",
    title: "Bojhena Shey Bojhena",
    artist: "Arijit Singh (Bengali)",
    language: "Other",
    duration: "4:30",
  },
  {
    id: "bn007",
    title: "Pagla Hawar Badol Dine",
    artist: "Shaan (Bengali)",
    language: "Other",
    duration: "4:15",
  },
  {
    id: "bn008",
    title: "Rupkatha Noy",
    artist: "Anupam Roy",
    language: "Other",
    duration: "4:05",
  },
  {
    id: "bn009",
    title: "Brishti Pore Tapur Tupur",
    artist: "Subhamita Banerjee",
    language: "Other",
    duration: "3:50",
  },
  {
    id: "bn010",
    title: "Ei Raat Tomar Amar",
    artist: "Kishore Kumar (Bengali)",
    language: "Other",
    duration: "4:00",
  },

  // ── Marathi (10 songs) ───────────────────────────────────────────────────
  {
    id: "mr001",
    title: "Sairat Zaala Ji",
    artist: "Ajay Atul",
    language: "Other",
    duration: "3:40",
  },
  {
    id: "mr002",
    title: "Apsara Aali",
    artist: "Mangesh Padgaonkar",
    language: "Other",
    duration: "4:00",
  },
  {
    id: "mr003",
    title: "Tula Pahate Re",
    artist: "Saleel Kulkarni",
    language: "Other",
    duration: "4:10",
  },
  {
    id: "mr004",
    title: "Ye Re Ye Re Paisa",
    artist: "Sumeet Raghvan",
    language: "Other",
    duration: "3:30",
  },
  {
    id: "mr005",
    title: "Aai Shapath",
    artist: "Swapnil Bandodkar",
    language: "Other",
    duration: "3:50",
  },
  {
    id: "mr006",
    title: "Kombdi Palali",
    artist: "Marathi Folk",
    language: "Other",
    duration: "3:20",
  },
  {
    id: "mr007",
    title: "Hirkani",
    artist: "Ajay Atul",
    language: "Other",
    duration: "4:25",
  },
  {
    id: "mr008",
    title: "Gondhal",
    artist: "Ajay Atul",
    language: "Other",
    duration: "4:15",
  },
  {
    id: "mr009",
    title: "Natrang Natrang",
    artist: "Ajay Atul",
    language: "Other",
    duration: "3:55",
  },
  {
    id: "mr010",
    title: "Baya Ka Ghardaya",
    artist: "Marathi Folk",
    language: "Other",
    duration: "3:45",
  },
];

const LANG_FILTERS: { label: string; value: SongLanguage | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Hindi", value: "Hindi" },
  { label: "Punjabi", value: "Punjabi" },
  { label: "Tamil", value: "Tamil" },
  { label: "Telugu", value: "Telugu" },
  { label: "English", value: "English" },
  { label: "Other", value: "Other" },
];

// ---- Types ----

type CreatePostModalProps = {
  open: boolean;
  onClose: () => void;
  mode?: "post" | "story" | "reel";
};

type StickerType = "poll" | "question" | null;

interface PollSticker {
  type: "poll";
  question: string;
  optionA: string;
  optionB: string;
}

interface QuestionSticker {
  type: "question";
  prompt: string;
}

type Sticker_ = PollSticker | QuestionSticker;

interface SelectedSong {
  title: string;
  artist: string;
}

// ---- Helpers ----

function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}

function isVideoUrl(url: string) {
  return /\.(mp4|mov|webm|ogg|m4v|mkv)(\?|$)/i.test(url);
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string,
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`${label} timed out after ${ms / 1000}s`)),
        ms,
      ),
    ),
  ]);
}

function buildStickerCaption(
  caption: string,
  sticker: Sticker_ | null,
): string {
  if (!sticker) return caption;
  if (sticker.type === "poll") {
    const metadata = JSON.stringify({
      _stickerType: "poll",
      question: sticker.question,
      options: [sticker.optionA, sticker.optionB],
    });
    return caption
      ? `${caption}\n<!--sticker:${metadata}-->`
      : `<!--sticker:${metadata}-->`;
  }
  if (sticker.type === "question") {
    const metadata = JSON.stringify({
      _stickerType: "question",
      prompt: sticker.prompt,
    });
    return caption
      ? `${caption}\n<!--sticker:${metadata}-->`
      : `<!--sticker:${metadata}-->`;
  }
  return caption;
}

// ---- Music Picker Component ----

function MusicPicker({
  selected,
  onSelect,
  onRemove,
}: {
  selected: SelectedSong | null;
  onSelect: (song: SelectedSong) => void;
  onRemove: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [langFilter, setLangFilter] = useState<SongLanguage | "All">("All");

  const filtered = SONG_LIBRARY.filter((s) => {
    const matchesLang = langFilter === "All" || s.language === langFilter;
    const q = query.toLowerCase();
    const matchesQuery =
      !q ||
      s.title.toLowerCase().includes(q) ||
      s.artist.toLowerCase().includes(q) ||
      s.language.toLowerCase().includes(q);
    return matchesLang && matchesQuery;
  });

  if (selected) {
    return (
      <div
        className="flex items-center gap-2 bg-primary/10 border border-primary/30 rounded-xl px-3 py-2"
        data-ocid="create_post.music_selected"
      >
        <Music2 className="h-4 w-4 text-primary flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-semibold text-foreground truncate">
            {selected.title}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {selected.artist}
          </p>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
          aria-label="Remove song"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary border border-border text-[13px] font-medium hover:border-primary/50 transition-colors w-full"
        data-ocid="create_post.add_music.button"
      >
        <Music className="h-4 w-4 text-primary" />
        Add Music
        <span className="ml-auto text-[11px] text-muted-foreground">
          {SONG_LIBRARY.length} songs · {open ? "▲" : "▼"}
        </span>
      </button>

      {open && (
        <div
          className="bg-card border border-border rounded-xl overflow-hidden shadow-lg"
          data-ocid="create_post.music_picker"
        >
          {/* Search + language filter */}
          <div className="p-3 border-b border-border space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search songs, artists, or language..."
                className="pl-8 rounded-lg text-[13px] h-8"
                autoFocus
                data-ocid="create_post.music_search.input"
              />
            </div>

            {/* Language filter tabs */}
            <div
              className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-none"
              data-ocid="create_post.music_lang_filter"
            >
              {LANG_FILTERS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setLangFilter(f.value)}
                  className={[
                    "flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors",
                    langFilter === f.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80",
                  ].join(" ")}
                  data-ocid={`create_post.music_lang.${f.value.toLowerCase()}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Result count */}
          <div className="px-3 py-1.5 bg-secondary/30 border-b border-border/40">
            <p className="text-[11px] text-muted-foreground">
              {filtered.length} song{filtered.length !== 1 ? "s" : ""}
              {langFilter !== "All" ? ` in ${langFilter}` : ""}
              {query ? ` matching "${query}"` : ""}
            </p>
          </div>

          {/* Song list */}
          <div className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              <p className="text-[12px] text-muted-foreground text-center py-6">
                No songs found
              </p>
            ) : (
              filtered.map((song) => (
                <button
                  key={song.id}
                  type="button"
                  onClick={() => {
                    onSelect({ title: song.title, artist: song.artist });
                    setOpen(false);
                    setQuery("");
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary/60 transition-colors text-left border-b border-border/40 last:border-0"
                  data-ocid="create_post.music_song.item"
                >
                  <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                    <Music2 className="h-3.5 w-3.5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-foreground truncate">
                      {song.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {song.artist}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 flex-shrink-0">
                    <span className="text-[10px] text-muted-foreground/70 bg-secondary/80 px-1.5 py-0.5 rounded-full">
                      {song.language}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60">
                      {song.duration}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---- Sticker Editor ----

function StickerEditor({
  sticker,
  onSave,
  onCancel,
}: {
  sticker: StickerType;
  onSave: (s: Sticker_) => void;
  onCancel: () => void;
}) {
  const [pollQ, setPollQ] = useState("");
  const [pollA, setPollA] = useState("");
  const [pollB, setPollB] = useState("");
  const [prompt, setPrompt] = useState("");

  if (sticker === "poll") {
    return (
      <div className="bg-secondary/60 border border-border rounded-xl p-4 space-y-3">
        <p className="text-[13px] font-semibold text-foreground flex items-center gap-2">
          <Vote className="h-4 w-4 text-primary" /> Poll Sticker
        </p>
        <Input
          placeholder="Ask a question..."
          value={pollQ}
          onChange={(e) => setPollQ(e.target.value)}
          className="rounded-xl text-[13px]"
          data-ocid="create_post.poll.question.input"
        />
        <div className="grid grid-cols-2 gap-2">
          <Input
            placeholder="Option A"
            value={pollA}
            onChange={(e) => setPollA(e.target.value)}
            className="rounded-xl text-[13px]"
            data-ocid="create_post.poll.option_a.input"
          />
          <Input
            placeholder="Option B"
            value={pollB}
            onChange={(e) => setPollB(e.target.value)}
            className="rounded-xl text-[13px]"
            data-ocid="create_post.poll.option_b.input"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 rounded-xl"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            className="flex-1 gold-btn rounded-xl"
            disabled={!pollQ.trim() || !pollA.trim() || !pollB.trim()}
            onClick={() =>
              onSave({
                type: "poll",
                question: pollQ.trim(),
                optionA: pollA.trim(),
                optionB: pollB.trim(),
              })
            }
            data-ocid="create_post.poll.save_button"
          >
            Add Poll
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-secondary/60 border border-border rounded-xl p-4 space-y-3">
      <p className="text-[13px] font-semibold text-foreground flex items-center gap-2">
        <HelpCircle className="h-4 w-4 text-primary" /> Question Sticker
      </p>
      <Input
        placeholder="Ask me anything..."
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="rounded-xl text-[13px]"
        data-ocid="create_post.question.prompt.input"
      />
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 rounded-xl"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          size="sm"
          className="flex-1 gold-btn rounded-xl"
          disabled={!prompt.trim()}
          onClick={() => onSave({ type: "question", prompt: prompt.trim() })}
          data-ocid="create_post.question.save_button"
        >
          Add Question
        </Button>
      </div>
    </div>
  );
}

// ---- Main Modal ----

export function CreatePostModal({
  open,
  onClose,
  mode = "post",
}: CreatePostModalProps) {
  const { identity } = useInternetIdentity();
  const {
    upload: storageUpload,
    isReady: storageReady,
    waitUntilReady,
  } = useStorageClient();
  const { isOnline } = useOnlineStatus();
  const createPost = useCreatePost();
  const createCarouselPost = useCreateCarouselPost();
  const createStory = useCreateStory();

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const abortRef = useRef(false);

  // Story stickers
  const [activeStickerEditor, setActiveStickerEditor] =
    useState<StickerType>(null);
  const [appliedSticker, setAppliedSticker] = useState<Sticker_ | null>(null);

  // Music
  const [selectedSong, setSelectedSong] = useState<SelectedSong | null>(null);

  const isMultiple = imageFiles.length > 1;
  const firstFile = imageFiles[0];
  const firstIsVideo = firstFile ? isVideoFile(firstFile) : false;
  const isReelMode = mode === "reel";
  const isStoryMode = mode === "story";

  const acceptTypes =
    "image/jpeg,image/jpg,image/png,image/gif,image/webp,image/heic,video/mp4,video/quicktime,video/x-msvideo,video/x-matroska,video/webm";
  const maxFiles = isStoryMode || isReelMode ? 1 : 10;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (!files.length) return;
    const selected = files.slice(0, maxFiles);
    setImageFiles(selected);
    setImagePreviews(selected.map((f) => URL.createObjectURL(f)));
    setUploadError(null);
  };

  const removeImage = (idx: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== idx));
    setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleClose = () => {
    if (isUploading) return;
    setCaption("");
    setHashtags("");
    setImageFiles([]);
    setImagePreviews([]);
    setUploadProgress(0);
    setUploadStatus("");
    setUploadError(null);
    setAppliedSticker(null);
    setActiveStickerEditor(null);
    setSelectedSong(null);
    abortRef.current = false;
    onClose();
  };

  // ---- Core upload function: single file → URL ----
  // Uses storageUpload from useStorageClient which shares the EXACT same
  // authenticated StorageClient as the backend actor (no separate agent creation).
  // The useStorageClient hook itself handles 403 retry with exponential backoff.
  const uploadSingleFile = async (
    file: File,
    fileIndex: number,
    totalFiles: number,
  ): Promise<string> => {
    const MB = 1024 * 1024;
    const GB = 1024 * MB;
    if (file.size > 500 * MB) {
      const sizeLabel =
        file.size > GB
          ? `${(file.size / GB).toFixed(1)} GB`
          : `${(file.size / MB).toFixed(0)} MB`;
      toast.info(
        `Large file (${sizeLabel}) — this may take a while. Please keep this tab open.`,
      );
    }

    console.log(
      `[Upload] File ${fileIndex + 1}/${totalFiles}: "${file.name}" — ${file.size} bytes, type: ${file.type}`,
    );

    // Add a brief warm-up wait on the very first file.
    // Even when isReady=true the agent delegation certificate may not have been
    // exercised for a storage call yet, which causes a transient 403.
    // The useStorageClient hook retries internally on 403 with backoff, but
    // this small delay reduces the chance of ever hitting that path.
    if (fileIndex === 0) {
      await sleep(600);
    }

    const TIMEOUT_MS = 180_000; // 3 min for large files

    if (abortRef.current) throw new Error("Upload cancelled");
    setUploadStatus(`Uploading file ${fileIndex + 1}/${totalFiles}...`);
    console.log(
      `[Upload] starting storageUpload for file ${fileIndex + 1}/${totalFiles}`,
    );

    const { url } = await withTimeout(
      storageUpload(file, (pct) => {
        if (abortRef.current) return;
        const progress = Math.round((fileIndex * 100 + pct) / totalFiles);
        setUploadProgress(progress);
        setUploadStatus(
          `Uploading ${fileIndex + 1}/${totalFiles}... ${progress}%`,
        );
      }),
      TIMEOUT_MS,
      `upload("${file.name}")`,
    );

    console.log(`[Upload] URL resolved: ${url.slice(0, 80)}...`);
    return url;
  };

  // ---- Upload orchestrator ----
  const runUpload = async (): Promise<string[] | null> => {
    if (!imageFiles.length) return null;
    if (!identity) {
      toast.error("Please sign in to upload");
      return null;
    }
    if (!isOnline) {
      toast.error(
        "No internet connection — check your connection and try again",
      );
      return null;
    }

    // If the storage adapter isn't ready yet, wait up to 10 seconds for it.
    // This prevents the 403 "Invalid payload" that occurs when uploadFile is
    // called before the HttpAgent has fully initialized its delegation chain.
    if (!storageReady) {
      setUploadStatus("Initializing storage...");
      try {
        await waitUntilReady(10_000);
      } catch {
        toast.error(
          "Storage is still loading — please wait a moment and try again.",
        );
        return null;
      }
    }

    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus("Uploading...");
    setUploadError(null);
    abortRef.current = false;

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < imageFiles.length; i++) {
        if (abortRef.current) {
          toast.info("Upload cancelled");
          return null;
        }
        try {
          const url = await uploadSingleFile(
            imageFiles[i],
            i,
            imageFiles.length,
          );
          uploadedUrls.push(url);
        } catch (err) {
          if (abortRef.current) {
            toast.info("Upload cancelled");
            return null;
          }
          const errMsg = err instanceof Error ? err.message : String(err);
          let userMsg: string;
          if (errMsg.includes("timed out")) {
            userMsg =
              "Upload timed out — your connection may be too slow for this file size. Please try again.";
          } else if (errMsg.includes("403") || errMsg.includes("Forbidden")) {
            userMsg =
              "Upload rejected (403) — please sign out, sign back in, and try again.";
          } else if (
            errMsg.includes("not ready") ||
            errMsg.includes("Storage not")
          ) {
            userMsg =
              "Storage not ready — please wait for the app to finish loading and try again.";
          } else if (errMsg.includes("hash")) {
            userMsg =
              "Could not get media URL after upload — please check your connection and try again.";
          } else {
            userMsg = `Upload failed: ${errMsg}`;
          }
          console.error("[Upload] File upload error:", err);
          setUploadError(userMsg);
          toast.error(userMsg);
          return null;
        }
      }

      setUploadProgress(100);
      setUploadStatus("Saving...");
      return uploadedUrls;
    } finally {
      // Caller handles setIsUploading(false)
    }
  };

  const handlePost = async () => {
    const uploadedUrls = await runUpload();
    if (!uploadedUrls) {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus("");
      return;
    }

    const parseTags = () =>
      hashtags
        .split(/[\s,#]+/)
        .filter(Boolean)
        .map((t) => t.replace(/^#/, ""));

    const finalCaption = isStoryMode
      ? buildStickerCaption(caption, appliedSticker)
      : caption;

    const songTitle = selectedSong?.title || null;
    const songArtist = selectedSong?.artist || null;

    try {
      if (isStoryMode) {
        await createStory.mutateAsync({
          imageUrl: uploadedUrls[0],
          caption: finalCaption,
          songTitle,
          songArtist,
        });
        toast.success("Story shared!");
      } else if (
        isReelMode ||
        (imageFiles.length === 1 && isVideoFile(imageFiles[0]))
      ) {
        await createPost.mutateAsync({
          imageUrl: uploadedUrls[0],
          caption,
          hashtags: parseTags(),
          isReel: true,
          songTitle,
          songArtist,
        });
        toast.success("Reel shared!");
      } else if (isMultiple || uploadedUrls.length > 1) {
        await createCarouselPost.mutateAsync({
          imageUrls: uploadedUrls,
          caption,
          hashtags: parseTags(),
          songTitle,
          songArtist,
        });
        toast.success("Carousel post shared!");
      } else {
        await createPost.mutateAsync({
          imageUrl: uploadedUrls[0],
          caption,
          hashtags: parseTags(),
          songTitle,
          songArtist,
        });
        toast.success("Post shared!");
      }
      handleClose();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : "Unknown error";
      const msg = `Couldn't save post — your file uploaded successfully. Please try submitting again. (${errMsg})`;
      console.error("[Upload] Backend save failed:", err);
      setUploadError(msg);
      toast.error(msg);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      setUploadStatus("");
    }
  };

  const handleCancelUpload = () => {
    abortRef.current = true;
    setIsUploading(false);
    setUploadProgress(0);
    setUploadStatus("");
    setUploadError(null);
  };

  const title = isStoryMode
    ? "Create Story"
    : isReelMode
      ? "Create Reel"
      : "Create Post";

  const isPending =
    createPost.isPending ||
    createCarouselPost.isPending ||
    createStory.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && !isUploading && handleClose()}
    >
      <DialogContent
        className="max-w-md rounded-2xl"
        data-ocid="create_post.modal"
      >
        <DialogHeader>
          <DialogTitle className="text-center text-[16px] font-semibold">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!identity && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 text-center">
              <p className="text-[13px] text-destructive font-medium">
                Please sign in to upload
              </p>
            </div>
          )}

          {/* Upload error with retry */}
          {uploadError && !isUploading && (
            <div
              className="bg-destructive/10 border border-destructive/30 rounded-xl p-3 space-y-2"
              data-ocid="create_post.error_state"
            >
              <p className="text-[12px] text-destructive font-medium leading-relaxed">
                {uploadError}
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full rounded-lg text-[12px] border-destructive/40"
                onClick={handlePost}
                disabled={!imageFiles.length}
                data-ocid="create_post.retry_button"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Drop zone / Preview */}
          {imagePreviews.length === 0 ? (
            <label
              htmlFor="post-image-upload"
              className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-colors"
              data-ocid="create_post.dropzone"
            >
              {isReelMode ? (
                <Film className="h-12 w-12 text-muted-foreground" />
              ) : mode === "post" ? (
                <Images className="h-12 w-12 text-muted-foreground" />
              ) : (
                <ImageIcon className="h-12 w-12 text-muted-foreground" />
              )}
              <p className="text-[14px] font-medium text-foreground text-center">
                {isReelMode
                  ? "Click to upload video"
                  : mode === "post"
                    ? "Click to upload photos or videos (up to 10)"
                    : "Click to upload photo or video"}
              </p>
              <p className="text-[12px] text-muted-foreground text-center">
                {isReelMode
                  ? "MP4, MOV, WebM — up to 100 GB"
                  : "JPG, PNG, GIF, MP4, MOV — up to 100 GB each"}
              </p>
              <input
                id="post-image-upload"
                type="file"
                accept={acceptTypes}
                multiple={mode === "post"}
                className="sr-only"
                onChange={handleFileChange}
                data-ocid="create_post.upload_button"
              />
            </label>
          ) : (
            <div className="space-y-2">
              {/* Primary preview */}
              <div className="relative">
                {firstIsVideo ? (
                  <video
                    src={imagePreviews[0]}
                    controls
                    className="w-full aspect-video object-cover rounded-xl bg-black"
                    playsInline
                    preload="metadata"
                  >
                    <track kind="captions" />
                  </video>
                ) : (
                  <img
                    src={imagePreviews[0]}
                    alt="Preview"
                    className="w-full aspect-square object-cover rounded-xl"
                  />
                )}
                {/* Song overlay on preview */}
                {selectedSong && (
                  <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 bg-black/60 backdrop-blur-sm rounded-full px-3 py-1.5 pointer-events-none">
                    <Music2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <p className="text-[12px] text-white truncate font-medium">
                      {selectedSong.title} · {selectedSong.artist}
                    </p>
                  </div>
                )}
                {isMultiple && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-[11px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Images className="h-3 w-3" />
                    {imagePreviews.length} files
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => {
                    if (!isUploading) {
                      setImagePreviews([]);
                      setImageFiles([]);
                      setUploadError(null);
                    }
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 disabled:opacity-50"
                  aria-label="Clear all files"
                  disabled={isUploading}
                  data-ocid="create_post.remove_image"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Thumbnail strip for multi-file posts */}
              {isMultiple && (
                <div
                  className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
                  data-ocid="create_post.carousel_strip"
                >
                  {imagePreviews.map((src, idx) => {
                    const fileIsVideo = imageFiles[idx]
                      ? isVideoFile(imageFiles[idx])
                      : isVideoUrl(src);
                    return (
                      <div
                        key={src}
                        className="relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 border-transparent bg-black"
                      >
                        {fileIsVideo ? (
                          <video
                            src={src}
                            className="w-full h-full object-cover"
                            muted
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={src}
                            alt={`Slide ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => !isUploading && removeImage(idx)}
                          className="absolute top-0.5 right-0.5 bg-black/60 text-white rounded-full p-0.5"
                          aria-label={`Remove file ${idx + 1}`}
                          disabled={isUploading}
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    );
                  })}
                  {imagePreviews.length < 10 && !isUploading && (
                    <label
                      htmlFor="post-image-add"
                      className="flex-shrink-0 w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                    >
                      <Images className="h-5 w-5 text-muted-foreground" />
                      <input
                        id="post-image-add"
                        type="file"
                        accept={acceptTypes}
                        multiple
                        className="sr-only"
                        onChange={(e) => {
                          const newFiles = Array.from(e.target.files ?? []);
                          const combined = [...imageFiles, ...newFiles].slice(
                            0,
                            10,
                          );
                          setImageFiles(combined);
                          setImagePreviews(
                            combined.map((f) => URL.createObjectURL(f)),
                          );
                        }}
                      />
                    </label>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2" data-ocid="create_post.loading_state">
              <div className="flex justify-between items-center">
                <p className="text-[12px] text-muted-foreground">
                  {uploadStatus || `Uploading... ${uploadProgress}%`}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-[12px] text-primary font-semibold">
                    {uploadProgress}%
                  </p>
                  <button
                    type="button"
                    onClick={handleCancelUpload}
                    className="text-[11px] text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Cancel upload"
                  >
                    Cancel
                  </button>
                </div>
              </div>
              <Progress value={uploadProgress} className="h-2 rounded-full" />
            </div>
          )}

          {/* Music picker — available for ALL modes when file is selected */}
          {imagePreviews.length > 0 && !isUploading && (
            <MusicPicker
              selected={selectedSong}
              onSelect={setSelectedSong}
              onRemove={() => setSelectedSong(null)}
            />
          )}

          {/* Story stickers */}
          {isStoryMode && imagePreviews.length > 0 && !isUploading && (
            <div className="space-y-2">
              {activeStickerEditor ? (
                <StickerEditor
                  sticker={activeStickerEditor}
                  onSave={(s) => {
                    setAppliedSticker(s);
                    setActiveStickerEditor(null);
                  }}
                  onCancel={() => setActiveStickerEditor(null)}
                />
              ) : appliedSticker ? (
                <div className="flex items-center justify-between bg-secondary/60 border border-border rounded-xl px-3 py-2">
                  <div className="flex items-center gap-2">
                    {appliedSticker.type === "poll" ? (
                      <Vote className="h-4 w-4 text-primary" />
                    ) : (
                      <HelpCircle className="h-4 w-4 text-primary" />
                    )}
                    <span className="text-[13px] font-medium text-foreground">
                      {appliedSticker.type === "poll"
                        ? appliedSticker.question
                        : appliedSticker.prompt}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAppliedSticker(null)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Remove sticker"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-muted-foreground">
                    Add sticker:
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveStickerEditor("poll")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-[12px] font-medium hover:border-primary/50 transition-colors"
                    data-ocid="create_post.add_poll.button"
                  >
                    <Vote className="h-3.5 w-3.5 text-primary" />
                    Poll
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveStickerEditor("question")}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary border border-border text-[12px] font-medium hover:border-primary/50 transition-colors"
                    data-ocid="create_post.add_question.button"
                  >
                    <HelpCircle className="h-3.5 w-3.5 text-primary" />
                    Question
                  </button>
                  <Sticker className="h-4 w-4 text-muted-foreground ml-auto" />
                </div>
              )}
            </div>
          )}

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="post-caption" className="text-[13px] font-semibold">
              Caption
            </Label>
            <Textarea
              id="post-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Write a caption..."
              className="resize-none rounded-xl text-[14px]"
              rows={3}
              disabled={isUploading}
              data-ocid="create_post.textarea"
            />
          </div>

          {/* Hashtags */}
          {mode !== "story" && (
            <div className="space-y-2">
              <Label
                htmlFor="post-hashtags"
                className="text-[13px] font-semibold"
              >
                Hashtags
              </Label>
              <Input
                id="post-hashtags"
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#travel #photography"
                className="rounded-xl text-[14px]"
                disabled={isUploading}
                data-ocid="create_post.hashtag.input"
              />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={handleClose}
              disabled={isUploading}
              data-ocid="create_post.cancel_button"
            >
              Cancel
            </Button>
            <Button
              className="flex-1 gold-btn rounded-xl font-semibold"
              onClick={handlePost}
              disabled={
                !imageFiles.length || isUploading || isPending || !identity
              }
              data-ocid="create_post.submit_button"
            >
              {isUploading
                ? `Uploading ${uploadProgress}%...`
                : isStoryMode
                  ? "Share Story"
                  : isReelMode
                    ? "Share Reel"
                    : isMultiple
                      ? "Share Carousel"
                      : "Share Post"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
