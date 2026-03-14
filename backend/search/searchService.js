import Business from "../models/Business.js";
import { expandTerms } from "./synonyms.js";

export async function searchBusinesses(query){

 const terms = expandTerms(query);

 const regex = new RegExp(query,"i");

 const results = await Business.find({

  $or:[
   {name:regex},
   {name_ar:regex},
   {keywords:{$in:terms}},
   {category:{$in:terms}}
  ]

 }).limit(10);

 return results;

}
