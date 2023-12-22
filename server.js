import express from 'express'
import cors from 'cors'
const app = express()
import { db } from './config.js'
import { getDocs, collection, deleteDoc, doc, getDoc, where, query, updateDoc } from 'firebase/firestore'
import process from 'process'
import chalk from 'chalk'
import axios from 'axios'
import dotenv from 'dotenv'

let env = dotenv.config().parsed

app.use(cors())
app.use(express.json())

const Welcome = async () => {
    console.log(chalk.bgBlue(`
    --------- Server วาฬฟ้า is running ---------
            url : https://localhost:3001        
    --------------------------------------------
`))
}

const CheckMemoryUsage = () => {
    // console.log("Free Memory : ", os.freemem())
    // console.log("Total Memory : ", os.totalmem())
    let arrayMemoryUsage = Object.entries(process.memoryUsage())

    arrayMemoryUsage.map((item) => {
        console.log(chalk.bgGreen(`${item[0]} => ${(item[1] / 1024 / 1024 * 100) / 100} MB`))
    })
}

Welcome()
CheckMemoryUsage()

// console.log(Object.entries(process.memoryUsage()))



// Delete Orders When orders expires

setInterval(async () => {
    let current_time = new Date().getTime()

    let orders_data = await getDocs(collection(db, 'orders')).then((res) => {
        let data = res.docs.map((item) => {

            return {
                ...item.data(),
                orderId: item.id
            }
        })

        return data
    })

    orders_data.map((item) => {
        let diffTime = item.timestampEnd - current_time

        if (diffTime <= 0 && !item.payment_success) {
            deleteDoc(doc(db, "orders", item.orderId)).then((res) => {
                console.log("Deleted Timeout Orders Sucessfully")
                // Return Lottery Can Buy to shop

                updateDoc(doc(db, 'users', item.userId), {
                    orderId: ''
                }).then(() => {
                    console.log("OrderId Delete in user")

                    if (item.cart && item.cart.length > 0) {
                        item.cart.map((itemCart) => {
                            updateDoc(doc(db, "lottery", itemCart.lotteryId), {
                                lock: false
                            }).then(() => {
                                console.log(chalk.green(`${itemCart.lotteryId} can buy`))
                            })
                        })
                    } else {
                        console.error("No item in cart")
                    }
                })

            })
        }
    })
}, 1000)



// setInterval(async () => {
//     let current_time = new Date().getTime()

//     let users_data = await getDocs(query(collection(db, 'users'), where("lockEnd", "!=", null))).then((res) => {
//         let data = res.docs.map((item) => {
//             return {
//                 ...item.data(),
//                 userId: item.id
//             }
//         })

//         return data
//     })

//     users_data.map(async (user) => {

//         let diffTime = user.lockEnd - current_time

//         if (diffTime <= 0) {
//             user.cart.map(async (lottery) => {
//                 await updateDoc(doc(db, 'lottery', lottery.lotteryId), {
//                     lock: false
//                 })
//             })

//             await updateDoc(doc(db, 'users', user.userId), {
//                 lockEnd: null,
//                 cart: []
//             })

//             let currentTime = new Date().getDate()
//             console.log(chalk.bgGreen(`Reset Cart (userCart, LotteryLock, deleteLockEnd) => ${currentTime}`))
//         }
//     })
// }, 1000)


// GroupId : C50d6008e31f79c1b01d67ec9d7152b14

app.post("/webhook", (req, res) => {
    if (req.body.events && req.body.events.length > 0) {
        console.log(req.body.events)
        let group = req.body.events[0].source.groupId
        console.log(group)

    }
    res.json(200)
})


app.post("/notify", async (req, res) => {
    let { name, lastName, numberPhone, total, slip_img, cart, donate, way } = req.body
    let cartJson = JSON.parse(cart)
    let combine_array_lottery = ''
    let totalQuantity

    if (cartJson && cartJson.length > 0) {
        totalQuantity = cartJson.reduce((total, current) => {
            return total = total + current.quantity
        }, 0)
    }

    console.log("Notify Start")

    await cartJson.map((item, index) => {
        if (index == 0) {
            combine_array_lottery = combine_array_lottery + `${item.number}`
        } else {
            combine_array_lottery = combine_array_lottery + ` ${item.number}`
        }
    })

    let CartTextShow = combine_array_lottery.replace(' ', ',')

    console.log(combine_array_lottery)
    // console.log(chalk.red("IMG SLIP DATA : ", slip_img))
    await axios.post("https://api.line.me/v2/bot/message/push", {
        to: 'C50d6008e31f79c1b01d67ec9d7152b14',
        messages: [
            {
                type: 'text',
                text: `คุณ ${name} ${lastName} \nเบอร์โทร : ${numberPhone} \n ช่องทางการสั่งซื้อ : ${way == 'ems' ? 'ส่ง EMS +50 บาท' : 'ปกติ'} \nยอดสั่งซื้อในระบบ : ${way == 'ems' ? (total + (totalQuantity * donate)) + 50 : (total + (totalQuantity * donate))} บาท \nหวยที่ซื้อ : ${CartTextShow} \nจำนวน : ${totalQuantity} ใบ \nเงินที่บริจาค : ${donate} บาท`
            },
            {
                type: 'image',
                originalContentUrl: slip_img,
                previewImageUrl: slip_img
            }
        ]
    }, {
        headers: {
            'Authorization': `Bearer ${env.ACCESS_TOKEN}`
        }
    }).then((res) => {
        console.log(res)
    })
})

app.get("/unlockLotteryAll", async (req, res) => {
    let lotteryGets = await getDocs(collection(db, 'lottery'))
    let allLottery = lotteryGets.docs.map((item) => {
        return {
            ...item.data(),
            lotteryId: item.id
        }
    })

    allLottery.map((item) => {
        updateDoc(doc(db, 'lottery', item.lotteryId), {
            lock: false
        })
    })

    console.log(chalk.green("Unlock All Lottery Successfully!"))
})



app.listen(3001, () => {
    console.log("Server is running on port 3001")
})