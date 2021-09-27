#!/usr/bin/env node
// USAGE: node histo.js <output filename>

"use strict"
// dependencies
let puppeteer = require('puppeteer')
//let devices = require('puppeteer/DeviceDescriptors')

// global goodness
let thisDate = new Date().toISOString().split('T')[0]

// image generator
let getImage = async () => {

  let browser = await puppeteer.launch()
  let page = await browser.newPage()

  let url = 'http://localhost:8001/index.html'
  await page.setViewport({
    width: 600,
    height: 180,
    deviceScaleFactor: 2
  })
  await page.goto(url)

  await page.exposeFunction('onCustomEvent', e => {
    console.log(`${e.type} fired`, e.detail || '');
  });

  function listenFor(type) {
    return page.evaluateOnNewDocument(type => {
      document.addEventListener(type, e => {
        window.onCustomEvent({type, detail: e.detail});
      });
    }, type);
  }

  await listenFor('doneDrawing');

  await new Promise(resolve => setTimeout(resolve, 1000))

  await page.screenshot({path: process.argv[2], fullPage: true})

  await browser.close()
}

// run it
getImage()
