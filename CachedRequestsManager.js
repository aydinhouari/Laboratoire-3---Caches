import * as utilities from "./utilities.js";
import * as serverVariables from "./serverVariables.js";
import HttpContext from "./httpContext.js";
import Repository from "./models/repository.js";
let requestsCachesExpirationTime = serverVariables.get("main.requestCache.expirationTime");

// Voir diapo 92 pour la logique de Cache
/* Cette classe
permettra d’ajouter dans une cache l’url de la requête, le payload de sa réponse et son ETag. Lorsque qu’une requête
comportera la même url, la classe retournera dans la réponse son payload et ETag enregistrés dans la cache.

- ### Pour les requêtes GET seulement ###
 */
global.requestsCaches = [];
global.cachedRequestsCleanerStarted = false;
export default class CachedRequestsManager {

    static startCachedRequestsCleaner() {
        setInterval(CachedRequestsManager.flushExpired, requestsCachesExpirationTime * 1000);
        console.log(BgBlue + FgWhite, "[Periodic requests data caches cleaning process started...]");
    }

    static add(url, content, ETag = "") {
        if (!cachedRequestsCleanerStarted) {
            cachedRequestsCleanerStarted = true;
            CachedRequestsManager.startCachedRequestsCleaner();
        }
        if (url != "") {
            CachedRequestsManager.clear(url);
            requestsCaches.push({
                url,
                content,
                ETag,
                Expire_Time: utilities.nowInSeconds() + requestsCachesExpirationTime
            });
            console.log(BgWhite + FgBlue, `[Data of ${url} request has been cached]`);
        }
    }

    static find(url) {
        try {
            if (url != "") {
                for (let cache of requestsCaches) {
                    if (cache.url == url) {
                        // renew cache
                        cache.Expire_Time = utilities.nowInSeconds() + requestsCachesExpirationTime;
                        console.log(BgGreen + FgWhite, `[Url ${cache.url} content retrieved from request's cache]`);
                        return [cache.content,cache.ETag];
                    }
                }
            }
        } catch (error) {
            console.log(BgRed + FgWhite, "[request cache error!]", error);
        }
        return null;
    }

    static clear(url) {
        if (url != "") {
            let indexToDelete = [];
            let index = 0;
            for (let cache of requestsCaches) {
                if (cache.url == url) indexToDelete.push(index);
                index++;
            }
            utilities.deleteByIndex(requestsCaches, indexToDelete);
        }
    }

    static flushExpired() {
        let now = utilities.nowInSeconds();
        for (let cache of requestsCaches) {
            if (cache.Expire_Time <= now) {
                console.log(BgYellow + FgRed, "Cached file data of " + cache.url + " expired");
            }
        }
        requestsCaches = requestsCaches.filter(cache => cache.Expire_Time > now);
    }

    /**
     * @param {HttpContext} HttpContext 
     */
    static get(HttpContext) {
        try {
            let [content = null, eTag = ""] = CachedRequestsManager.find(HttpContext.req.url) || [];

            if (!HttpContext.isCacheable || eTag == "")
                return false;
            else if(eTag != Repository.getETag(HttpContext.path.model) && eTag != ""){
                CachedRequestsManager.clear(HttpContext.req.url);
                return false;
            } else {
                HttpContext.response.JSON(
                    content,
                    eTag,
                    true
                );
                return true;
            }
        } catch (error) {
            console.log(BgRed + FgWhite, "[request cache error!]", error);
            return false;
        }
    }

} 