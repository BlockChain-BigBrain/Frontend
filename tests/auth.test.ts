import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createAuthClient,AuthError} from '../src/auth';
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status});
test('cookie restore, Bearer header and shared parallel refresh',async()=>{
 let refreshes=0;
 const client=createAuthClient('http://localhost:3000',async(url,init)=>{
  assert.equal(init?.credentials,'include');
  if(String(url).endsWith('/refresh?target=frontend')){refreshes++;await new Promise(r=>setTimeout(r,10));return json({result:{accessToken:'access'}});}
  assert.equal(new Headers(init?.headers).get('Authorization'),'Bearer access');return json({result:{id:1}});
 });
 const users=await Promise.all([client.me(),client.me()]);assert.equal(users[0].id,1);assert.equal(refreshes,1);
});
test('401 retry is bounded',async()=>{
 let calls=0;const client=createAuthClient('http://localhost:3000',async(url)=>{calls++;return String(url).endsWith('/refresh?target=frontend')?json({result:{accessToken:'a'}}):json({},401);});
 await assert.rejects(client.me(),AuthError);assert.equal(calls,4);
});
test('logout waits for refresh and discards late token',async()=>{
 const calls:string[]=[];const client=createAuthClient('http://localhost:3000',async(url)=>{
  calls.push(String(url));if(String(url).endsWith('/refresh?target=frontend')){await new Promise(r=>setTimeout(r,10));return json({result:{accessToken:'a'}});}return new Response(null,{status:204});
 });
 const pending=assert.rejects(client.me(),AuthError);await client.logout();await pending;
 assert.equal(calls.length,2);assert.ok(calls[1].endsWith('/logout?target=frontend'));
});
test('rejects external API paths',async()=>{const c=createAuthClient('http://localhost:3000');await assert.rejects(c.apiFetch('https://evil.test'));});

test('first visit stays signed out when only a Swagger session exists', async () => {
 const calls:string[]=[];
 const client=createAuthClient('http://localhost:3000',async(url)=>{
  calls.push(String(url));
  assert.equal(String(url),'http://localhost:3000/api/v1/auth/refresh?target=frontend');
  return json({isSuccess:false,result:null},401);
 });
 await assert.rejects(client.me(),AuthError);
 assert.equal(calls.length,1);
 assert.equal(client.loginUrl,'http://localhost:3000/api/v1/auth/login/google?target=frontend');
});
