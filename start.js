
const {$} = require('jolt.sh');

// starts the server, y'know, the freakin server!
const startServer = () => {

    $`cargo run`;
}

// generates https certificate for given host
const generateCertificate = (host) => {

    $`openssl genrsa -out auth/${host}.key 2048`;
    $`openssl req -new -x509 -key auth/${host}.key -out auth/${host}.cert -days 3650 -subj /CN=${host}`;
}

const rollup = (watch = false) => {
    if (watch) {
        $`rollup -c -w`;
    } else {
        $`rollup -c`;
    }
}
 
const copyDependencies = () => {
    // copy dependendies from node_modules to public/dist
    // to make publicly visible

    $`cp node_modules/vue/dist/vue.min.js public/dist/`;
    $`cp node_modules/vue-router/dist/vue-router.min.js public/dist/`;
    $`cp node_modules/vuex/dist/vuex.min.js public/dist/`;
    $`cp node_modules/vuetify/dist/vuetify.min.js public/dist/`;
    $`cp node_modules/vuetify/dist/vuetify.min.css public/dist/`;
    $`cp node_modules/vue-the-mask/dist/vue-the-mask.js public/dist/`;
    $`cp node_modules/validator/validator.min.js public/dist/`;
}

const postInstall = () => {
    rollup();
    copyDependencies();

    $`cargo build`;
}

const main = (script, args) => {

    if (script === null) {
        startServer();
    } else {
        switch (script){
            case 'server':
                startServer(args.length > 0 ? args[0] : 'dev');
                return;

            case 'certify':
                generateCertificate(args.length > 0 ? args[0] : '127.0.0.1');
                return;

            // scripts "rollup" and "build" do the same thing for now...
            case 'rollup':
            case 'build':
                rollup(args.length > 0 && args[0] === 'watch');
                return;

            case 'postinstall':
                postInstall();
                return;

            // case 'other-script-name':
            //      add other scripts here...

            default:
                console.log(`Invalid script "${script}"`);
                process.exit(0);
        }
    }
}

if (process.argv.length > 2) {
    const [script, ...args] = process.argv.slice(2);

    main(script, args);
} else {
    main(null, []);
}
