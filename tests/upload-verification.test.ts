import { test } from 'node:test'
import assert from 'node:assert/strict'
import { JSDOM } from 'jsdom'
import { act, createElement } from 'react'
import { createRoot } from 'react-dom/client'
let fixtureFetch: typeof globalThis.fetch
import { SCENARIOS } from './fixtures/chain-scenarios'
const account = '0x1111111111111111111111111111111111111111'
const cid = 'bafkreigh2akiscaildc6o6p2nhccz3u5c6afgzkgkbb37faqxnxm6woj5m'
async function harness(verdict: string, status = 'VERIFIED', backendReady = true, defer = false, allowSend = false) {
  const dom = new JSDOM('<div id="root"></div>', { url: 'http://localhost:8443/Frontend/' })
  for (const key of ['window','document','localStorage','FormData','File','Blob','HTMLElement','Event','MouseEvent']) Object.defineProperty(globalThis,key,{ configurable:true,value:(dom.window as any)[key] })
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  dom.window.confirm = () => true
  const walletCalls: string[] = []
  let chainId = '0x7a69'
  ;(dom.window as any).ethereum = { request: async ({ method }: { method: string }) => {
    walletCalls.push(method)
    if (method === 'eth_accounts') return [account]
    if (method === 'eth_chainId') return chainId
    if (method === 'wallet_switchEthereumChain') { chainId = '0x7a69'; return }
    if (allowSend && method === 'eth_requestAccounts') return [account]
    if (allowSend && method === 'eth_sendTransaction') return '0x'+'a'.repeat(64)
    if (allowSend && method === 'eth_getTransactionReceipt') return {status:'0x1'}
    throw Error('No wallet signatures or transactions expected')
  } }
  const history = [{ id:6,trackId:19,status:'REJECTED',source:'AI',errorCode:'AI_ANALYSIS_FAILED' },{ id:7,trackId:19,status:'REJECTED',source:'AI',errorCode:'AI_ANALYSIS_FAILED' }]
  const result = { id:10,trackId:19,status,source:'AI',riskStatus:verdict,duplicate:verdict==='BLOCK',riskScore:'1',errorCode:status==='REJECTED'?'AI_ANALYSIS_FAILED':null,evidence:{decision:verdict,similarityScore:null,queryWindowCount:0,duplicate:{detected:verdict==='BLOCK',matchedTrackId:'original_music/zephiramusic-halloween-lofi-599381.mp3'}} }
  const track: any = {id:19,ownerId:1,title:'actual',contributionsFinalizedAt:'2026-11-05',registrationStatus:'NOT_REGISTERED',metadataCid:null,verifications:[],owner:{walletAddress:account}}
  let prepared = false, release: () => void = () => {}
  const pending = new Promise<void>(resolve => {release=resolve})
  const calls: Array<{path:string;method:string}> = []
  const response = (value: unknown) => new Response(JSON.stringify(value))
  const packet = () => ({ready:prepared && backendReady,missing:!track.metadataCid?['realMetadataCid','registrationRequest']:!backendReady?['verificationSigner']:[],transaction:prepared?{chainId:'31337',from:account,to:account,data:'0x1234',value:'0'}:null})
  fixtureFetch = async (url,init={}) => {
    const path=new URL(String(url)).pathname,method=init.method||'GET';calls.push({path,method})
    if(path.endsWith('/refresh'))return response({result:{accessToken:'fixture'}})
    if(path.endsWith('/me'))return response({result:{id:1,nickname:'Creator'}})
    if(path.includes('/invitations'))return response([])
    if(path==='/api/tracks'&&method==='POST')return response(track)
    if(path==='/api/tracks/19')return response(track)
    if(path.endsWith('/verify')||path.endsWith('/reverify')){
      if(defer)await pending
      track.verifications=[...history,result] // Deliberately oldest-first.
      return response(result)
    }
    if(allowSend && path.endsWith('/registration/confirm')){track.registrationStatus='REGISTERED';return response({registrationStatus:'REGISTERED'})}
    if(path.endsWith('/wallet'))return response({walletAddress:account})
    if(path.endsWith('/metadata/prepare'))return response({status:'PREPARED'})
    if(path.endsWith('/metadata/upload')){track.metadataCid=cid;return response({status:'UPLOADED',metadataCid:cid})}
    if(path.endsWith('/registration-payload')){if(method==='POST')prepared=true;return response(packet())}
    throw Error(`Unexpected fixture request ${method} ${path}`)
  }
  globalThis.fetch = (...args) => fixtureFetch(...args)
  const {default:Upload}=await import('../src/features/upload/UploadPage')
  const root=createRoot(document.getElementById('root')!)
  await act(async()=>root.render(createElement(Upload,{chainResult:SCENARIOS['success-pass'].result})))
  const button=(text:string)=>[...document.querySelectorAll('button')].find(b=>b.textContent?.trim()===text)!
  const choose=async(name:string)=>{
    const input=document.querySelector('input[type=file]')!
    Object.defineProperty(input,'files',{configurable:true,value:[new File(['audio'],name,{type:'audio/wav'})]})
    await act(async()=>input.dispatchEvent(new Event('change',{bubbles:true})))
  }
  await choose('actual.wav')
  await act(async()=>button('음원 업로드').click())
  assert.ok(button('기여도 확정 · 실제 AI 검증'), JSON.stringify({alerts:[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent),calls,title:document.querySelector<HTMLInputElement>('[aria-label="음원 제목"]')?.value}))
  return {dom,root,track,calls,walletCalls,button,choose,release,setChain:(value:string)=>{chainId=value},close:async()=>{await act(async()=>root.unmount());dom.window.close()}}
}

test('Track 19 BLOCK renders real duplicate details and cannot start IPFS, registration or MetaMask',async()=>{
  const h=await harness('BLOCK')
  try {
    await act(async()=>h.button('기여도 확정 · 실제 AI 검증').click())
    const notice=[...document.querySelectorAll('[role=status]')].find(e=>e.textContent?.includes('AI 검증 결과: BLOCK'))!
    assert.ok(notice);assert.match(notice.textContent!,/기존 음원과 중복.*등록할 수 없습니다/)
    assert.match(notice.textContent!,/zephiramusic-halloween-lofi-599381.mp3/)
    assert.match(notice.textContent!,/CLAP 유사도: 미산출/);assert.doesNotMatch(notice.textContent!,/100%|0\.00%|다음 단계에서 IPFS/)
    assert.ok(h.button('실제 온체인 등록 (MetaMask)').disabled);assert.ok(h.button('IPFS 업로드 · 등록 준비').disabled)
    await act(async()=>{h.button('실제 온체인 등록 (MetaMask)').click();h.button('IPFS 업로드 · 등록 준비').click()})
    assert.equal(h.calls.some(c=>/metadata|registration/.test(c.path)),false)
    assert.deepEqual(h.walletCalls,[])
    await h.choose('another.wav')
    assert.doesNotMatch(document.body.textContent!,/AI 검증 결과: BLOCK|zephiramusic-halloween-lofi-599381.mp3/)
    assert.equal([...document.querySelectorAll('button')].some(b=>b.textContent==='실제 온체인 등록 (MetaMask)'),false)
  } finally {await h.close()}
})
test('PASS, WARN and HOLD use separate IPFS preparation and backend-ready wallet registration gates',async()=>{
  for(const [verdict,label] of [['PASS','AI 검증 통과'],['WARN','유사 음원 주의'],['HOLD','추가 검토 필요']]){
    const h=await harness(verdict)
    try {
      await act(async()=>h.button('기여도 확정 · 실제 AI 검증').click())
      assert.match(document.body.textContent!,new RegExp(label))
      if(verdict==='HOLD')assert.match(document.body.textContent!,/라이선스 구매는 차단/)
      assert.ok(h.button('실제 온체인 등록 (MetaMask)').disabled)
      assert.equal(h.button('IPFS 업로드 · 등록 준비').disabled,false)
      assert.match(document.body.textContent!,/등록 준비 필요:.*IPFS/)
      await act(async()=>h.button('IPFS 업로드 · 등록 준비').click())
      assert.equal(h.button('실제 온체인 등록 (MetaMask)').disabled,false)
      assert.ok(h.calls.some(c=>c.path.endsWith('/metadata/upload')&&c.method==='POST'))
      assert.ok(h.calls.some(c=>c.path.endsWith('/registration-payload')&&c.method==='POST'))
      assert.equal(h.walletCalls.includes('eth_sendTransaction'),false)
    }finally{await h.close()}
  }
})
test('ready:false keeps MetaMask disabled and translates missing signature requirements',async()=>{
  const h=await harness('PASS','VERIFIED',false)
  try{
    await act(async()=>h.button('기여도 확정 · 실제 AI 검증').click())
    await act(async()=>h.button('IPFS 업로드 · 등록 준비').click())
    assert.ok(h.button('실제 온체인 등록 (MetaMask)').disabled)
    assert.match(document.body.textContent!,/검증 서명 설정/)
  }finally{await h.close()}
})
test('REJECTED is retryable and PENDING/RUNNING cannot register',async()=>{
  for(const status of ['REJECTED','FAILED','PENDING','RUNNING']){
    const h=await harness('PASS',status)
    try{
      await act(async()=>h.button('기여도 확정 · 실제 AI 검증').click())
      assert.match(document.body.textContent!,status==='REJECTED'||status==='FAILED'?/AI 검증 실패 · 재시도 필요/:/AI 검증 진행 중/)
      assert.ok(h.button('실제 온체인 등록 (MetaMask)').disabled)
      assert.ok(h.button('IPFS 업로드 · 등록 준비').disabled)
      assert.equal(h.button('기여도 확정 · 실제 AI 검증').disabled,status==='PENDING'||status==='RUNNING')
      assert.equal(h.calls.some(c=>/metadata|registration/.test(c.path)),false)
    }finally{await h.close()}
  }
})
test('late verification response cannot attach the previous track result to a newly selected file',async()=>{
  const h=await harness('BLOCK','VERIFIED',true,true)
  try{
    await act(async()=>h.button('기여도 확정 · 실제 AI 검증').click())
    await h.choose('new-track.wav')
    await act(async()=>{h.release();await new Promise(resolve=>setTimeout(resolve,0))})
    assert.doesNotMatch(document.body.textContent!,/AI 검증 결과: BLOCK|zephiramusic-halloween-lofi-599381.mp3/)
    assert.equal(h.calls.some(c=>/metadata|registration/.test(c.path)),false)
  }finally{await h.close()}
})


test('eligible backend-ready registration retains MetaMask submission and receipt confirmation',async()=>{
  const h=await harness('PASS','VERIFIED',true,false,true)
  try{
    await act(async()=>h.button('기여도 확정 · 실제 AI 검증').click())
    await act(async()=>h.button('IPFS 업로드 · 등록 준비').click())
    await act(async()=>h.button('실제 온체인 등록 (MetaMask)').click())
    assert.equal(h.walletCalls.filter(c=>c==='eth_sendTransaction').length,1)
    assert.ok(h.calls.some(c=>c.path.endsWith('/registration/confirm')&&c.method==='POST'))
    assert.match(document.body.textContent!,/온체인 등록 및 Backend 확인이 완료/)
  }finally{await h.close()}
})

test('newer server BLOCK prevents a previously enabled registration button from posting or sending',async()=>{
  const h=await harness('PASS')
  try{
    await act(async()=>h.button('기여도 확정 · 실제 AI 검증').click())
    await act(async()=>h.button('IPFS 업로드 · 등록 준비').click())
    assert.equal(h.button('실제 온체인 등록 (MetaMask)').disabled,false)
    h.track.verifications.push({id:11,trackId:19,source:'AI',status:'VERIFIED',riskStatus:'BLOCK',duplicate:true,evidence:{decision:'BLOCK',similarityScore:null}})
    const callsBefore=h.calls.length
    await act(async()=>h.button('실제 온체인 등록 (MetaMask)').click())
    assert.equal(h.calls.slice(callsBefore).some(c=>/metadata|registration/.test(c.path)),false)
    assert.equal(h.walletCalls.includes('eth_sendTransaction'),false)
    assert.match(document.body.textContent!,/AI 검증 결과: BLOCK/)
    assert.ok(h.button('실제 온체인 등록 (MetaMask)').disabled)
  }finally{await h.close()}
})


test('Hardhat switch button resolves the network gate without wallet binding signatures or sending a transaction',async()=>{
  const h=await harness('PASS')
  try{
    await act(async()=>h.button('기여도 확정 · 실제 AI 검증').click())
    await act(async()=>h.button('IPFS 업로드 · 등록 준비').click())
    h.setChain('0x1')
    await act(async()=>h.button('검증·등록 조건 새로고침').click())
    assert.ok(h.button('실제 온체인 등록 (MetaMask)').disabled)
    await act(async()=>h.button('Hardhat 네트워크로 전환').click())
    assert.equal(h.button('실제 온체인 등록 (MetaMask)').disabled,false)
    assert.ok(h.walletCalls.includes('wallet_switchEthereumChain'))
    assert.equal(h.walletCalls.includes('personal_sign'),false)
    assert.equal(h.walletCalls.includes('eth_sendTransaction'),false)
    assert.equal(h.calls.some(c=>c.path.endsWith('/wallet/challenge')),false)
  }finally{await h.close()}
})
