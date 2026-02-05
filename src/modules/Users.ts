import { UUID } from "node:crypto";

export default interface Users{
userId:UUID;
name:string;
email:string;
password:String;
role:string;
image:string;
}