const express = require("express")
const router = new express.Router()
const ExpressError = require("../expressError")
const db = require("../db")

router.get('/', async function (req, res, next) {
    try {
        const results = await db.query(`SELECT id, comp_code FROM invoices`)
        return res.json({invoices: results.rows})
    }
    catch(e) {
        next(e)
    }
})

router.get('/:id', async function (req, res, next) {
    try {
        const result = await db.query(`SELECT i.id, i.amt, i.paid, 
        i.add_date, i.paid_date, c.code,
        c.name, c.description
        FROM invoices AS i
        INNER JOIN companies AS c ON (i.comp_code = c.code)  
        WHERE id = $1`, [req.params.id])
        if (result.rows.length === 0) {
            throw new ExpressError('Invoice not found', 404)
        }
        const invoice = result.rows[0]
        console.log(invoice)
        return res.json({invoice: {id: invoice.id,
            amt: invoice.amt, 
            paid: invoice.paid,
            add_date: invoice.add_date,
            paid_date: invoice.paid_date,
            company: {
                code: invoice.code,
                name: invoice.name,
                description: invoice.description
            }
        }})
    }
    catch(e) {
        next(e)
    }
})

router.post('/', async function (req, res, next) {
    try {
        const { comp_code, amt } = req.body;
        if (comp_code == undefined || comp_code.length === 0) {
            throw new ExpressError('Please enter a code', 400)
        }
        if (amt == undefined || amt.length === 0) {
            throw new ExpressError('Please enter an amount', 400)
        }
        const results = await db.query(`INSERT INTO invoices (comp_code, amt)
        VALUES ($1, $2)
        RETURNING comp_code, amt`,
        [comp_code, amt])
        return res.status(201).json({invoice: results.rows[0]})
    }
    catch(e) {
        next(e)
    }
})

router.put('/:id', async function (req, res, next) {
    try {
        const { amt } = req.body;
        const result = await db.query(`UPDATE invoices SET amt=$1
        WHERE id = $2
        RETURNING id, comp_code, amt,
        paid, add_date, paid_date`,
        [amt, req.params.id])
        if (result.rows.length === 0) {
            throw new ExpressError('Invoice not found', 404)
        }
        return res.json({invoice: result.rows[0]})
    }
    catch(e) {
        next(e)
    }
})

router.delete('/:id', async function (req, res, next) {
    try {
        const result = await db.query(`DELETE FROM invoices
        WHERE id = $1`,
        [req.params.id])
        if (result.rowCount === 0) {
            throw new ExpressError('Invoice not found', 404)
        }
        return res.json({status: "deleted"})
    }
    catch(e) {
        next(e)
    }
})

module.exports = router;