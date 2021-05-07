const express = require('express');
// const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser')
const fs = require('fs');
const sharp = require('sharp')
var { isNull, last } = require('lodash')
var request = require('request');
const { resolve } = require('path');

const app = express();
const PORT = process.env.PORT || 5000

app.use('/uploads', express.static('uploads'))

filepath  = function(last = '',post){
    return ( post.owner?.username || post.owner?.id || 'nill' ) + '_' + ( post.shortcode || post.id || post.__typename ) + ( last ? '_' + last : '' ) + '.jpg';
};
async function download(uri, filename = 'uploads', callback = function(file){console.log(file);}){
    return new Promise(async function(resolve) { 
        if( fs.existsSync(filename) ) resolve(filename);
        await request.head(uri, async function(err, res, body){
            await request(uri).pipe(fs.createWriteStream(filename)).on('close', callback);
            resolve(filename);
        });
    })
}

app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })) // for parsing application/x-www-form-urlencoded
app.get('/', function(req, res){
    res.send('Hello Herokuapp');
})

app.post('/createstory', async function (req, res, next) {

    var post = req.body;
    // console.log('post', post);
    var output = {
        story: filepath('story', post),
        feed: filepath('feed', post)
    };
    var fileurl = last(post?.display_resources)?.src

    try {
        var file =  './uploads/' + ( post.shortcode || post.id || post.__typename ) + '.jpg';

        console.log(post?.action == undefined, post?.action != 'delete');
        if(post?.action == undefined || post?.action != 'delete') {
            await download(fileurl, file, async function(){
    
                // creating for story
                sharp(file).resize(1080).toBuffer().then( async butter => {
                    var finaloutput = await sharp({
                        create: {
                            width: 1080,
                            height: 1920,
                            channels: 4,
                            background: { r: 255, g: 255, b: 255, alpha: 1 }
                        }
                    })
                    .flatten( { background: '#ffffff' } )
                    .composite([{ input: butter }])
                    .sharpen().withMetadata().toFile( 'uploads/' + output.story);
                });
    
                 // creating for feed
                await download(fileurl, file, async function(){
                    sharp(file).resize(null, 1080).toBuffer().then( async butter => {
                        var feedfinaloutput = await sharp({
                            create: {
                                width: 1080,
                                height: 1080,
                                channels: 4,
                                background: { r: 255, g: 255, b: 255, alpha: 1 }
                            }
                        })
                        .flatten( { background: '#ffffff' } )
                        .composite([{ input: butter }])
                        .sharpen().withMetadata().toFile( 'uploads/' + output.feed);
                    });
                })
            })
        } else {
            await fs.existsSync(file) && await fs.unlinkSync(file);
            await fs.existsSync('./uploads/' + output.story) && await fs.unlinkSync('./uploads/' + output.story);
            await fs.existsSync('./uploads/' + output.feed)  && await fs.unlinkSync('./uploads/' + output.feed);
            res.json({status: 'ok'});
            return;
        }
        
    } catch (error) {
        console.log('shorp', error);
    }

    res.json(output);

})

app.listen(PORT, function() {
  console.log('Express server listening on port ', PORT); // eslint-disable-line
});
