export async function askAI(message:string){

 const res = await fetch("AI API",{
  method:"POST",
  body: JSON.stringify({message})
 })

 const data = await res.json()

 return data
}