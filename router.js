export const API_EndPoint = function (HttpContext) {
    return new Promise(async resolve => {
        if (!HttpContext.path.isAPI) {
            resolve(false);
        } else {
            let controllerName = HttpContext.path.controllerName;
            if (controllerName != undefined) {
                try {
                    // dynamically import the targeted controller
                    // if the controllerName does not exist the catch section will be called
                    const { default: Controller } = (await import('./controllers/' + controllerName + '.js'));
                    // instanciate the controller       
                    let controller = new Controller(HttpContext);
                    switch (HttpContext.req.method) {
                        case 'HEAD':
                            controller.head();
                            resolve(true);
                            break;
                        case 'GET':
                            controller.get(HttpContext.path.id);
                            resolve(true);
                            break;
                        case 'POST':
                            if (HttpContext.payload)
                                controller.post(HttpContext.payload);
                            else
                                HttpContext.response.unsupported();
                            resolve(true);
                            break;
                        case 'PUT':
                            if (HttpContext.payload)
                                controller.put(HttpContext.payload);
                            else
                                HttpContext.response.unsupported();
                            resolve(true);
                            break;
                        case 'DELETE':
                            controller.remove(HttpContext.path.id);
                            resolve(true);
                            break;
                        default:
                            HttpContext.response.notImplemented();
                            resolve(true);
                            break;
                    }
                } catch (error) {
                    console.log(BgRed + FgWhite, "API_EndPoint Error message: \n", `[${error.message}]`);
                    console.log(FgRed, "Stack: \n", error.stack);
                    HttpContext.response.notFound();
                    resolve(true);
                }
            } else {
                // not an API endpoint
                // must be handled by another middleware
                resolve(false);
            }
        }
    })
}