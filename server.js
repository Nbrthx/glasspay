const Koa = require("koa")
const send = require("koa-send")
const serve = require("koa-static")
const bodyParser = require("koa-bodyparser")
const EC = require("elliptic").ec

const app = new Koa()
const ec = new EC("secp256k1")

const bankkey = ec.genKeyPair()
const pubbank = bankkey.getPublic(true, "hex")
const privbank = bankkey.getPrivate("hex")

const users = {}
const aliases = {
  bank: pubbank
}
const genesis = null

genesisAccount(pubkey, username){
  const key = ec.keyFromPublic(pubkey, "hex")
  const time = Date.now()
  const sign = key.sign(pubkey+amount+time).toDER("hex")

  const banksign = bankkey.sign(pubbank, 100000000).toDER("hex")

  users[pubkey] = {
    owner: username,
    amount: 100000000,
    time: time,
    signature: sign,
    prev: {
      with: "bank",
      amount: 100000000,
      signature: banksign
    }
  }
}

account(pubkey, username){
  const key = ec.keyFromPublic(pubkey, "hex")
  const time = Date.now()
  const sign = key.sign(pubkey+amount+time).toDER("hex")

  users[pubkey] = {
    owner: username,
    amount: 0,
    time: time,
    signature: sign
  }
}

digest(user){
  const pub = aliases[user]
  user = users[user]

  users[pub] = bankkey.sign(user.owner+user.amount+user.time).toDER("hex")
}

verify(user){
  const pub = aliases[user]
  user = users[user]

  if(!user.signature) return false

  const key = ec.keyFromPublic(pub, "hex")
  return key.verify(user.owner+user.amount+user.time, user.signature)
}

validPrev(prev, pubkey){
  const pub = aliases[prev.with]

  const from = prev.amount >= 0

  if(from && prev.with == "bank"){
    if(genesis) return false
    genesis = bankkey.sign("genesis").toDER("hex")
  }

  const key = ec.keyFromPublic(from?pub:pubkey, "hex")

  if(from) return key.verify(pub+pubkey+prev.amount, prev.signature)
  return key.verify(pubkey+pub+prev.amount, prev.signature)
}

transfer(from, to, amount, signature){
  const userFrom = users[aliases[from]]
  const userTo = users[aliases[to]]

  const validfrom = verify(from)
  const validto = verify(to)
  const fromhalal = validPrev(userFrom.prev, pubfrom)
  const tohalal = validPrev(userTo.prev, pubto)
  const validamount = amount > 0 && amount >= userFrom.amount

  if(validfrom && validto && fromhalal && tohalal && validamount){
    userFrom.amount -= amount
    userFrom.time = Date.now()
    userFrom.prev = {
      with: to,
      amount: -amount,
      signature: signature
    }
    users[aliases[from]] = userFrom
    digest(from)

    userTo.amount += amount
    userTo.time = Date.now()
    userTo.prev = {
      with: from,
      amount: amount,
      signature: signature
    }
    users[aliases[to]] = userTo
    digest(to)

    return true
  }
  return false
}

app.use(bodyParser())
app.use(serve(__dirname+"/public"))
app.use(async ctx => {
  if(ctx.path == "/api"){
    const api = ctx.querystring
    if(api == "account")
    ctx.body = { text: "Hello World" }
  }else{
    await send(ctx, "index.html", { root: "public" })
  }
})

app.listen(3000, () => console.log("Listen on",3000))