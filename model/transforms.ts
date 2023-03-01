//@ts-check

export type PropertyObtainedCB = (propertyValue: string, transformOutput: string[], context?: any) => any

/**
 * Transform / Map object to something else
 * 
 * Currently only method calls or non-optional properties supported here
 * 
 * Example:
 * mapMethodProperties(anyobject, [['getColor',(color,collect)=>collect.push(`textcolor="${color}"`)],...])
 * 
 * If getColor returns a value, it is passed to the transform callback and stored in output array
 * results => ['textcolor="#ffff00"]
 * 
 * @param obj Reference object
 * @param mapProperties array (of tuples of) method to call on reference object, and callback that gets the value, output array and context
 * @param results Output array, results of transformation collected here
 * @param context Anything to be passed to mapProperties callback
 */
export const mapMethodProperties = <
    MethodOrNonOptionalProperty extends PropertyKey, // works for methods or non-optional properties
    T extends Record<MethodOrNonOptionalProperty, any>>(obj: T, mapProperties: [MethodOrNonOptionalProperty, PropertyObtainedCB][], results: string[], context?: any): void => {
    for (const [m, cb] of mapProperties) {
        if (typeof (obj[m]) !== 'function') {
            continue
        }
        const result = (typeof (obj[m]) == 'function') ? obj[m]() : obj[m]
        if (result) {
            cb(result, results, context)
        }
    }
}

export const mapPropertyProperties = <T, K extends keyof T>(obj: T, mapProperties: [K, PropertyObtainedCB][], results: string[], context?: any) => {
    for (const [m, cb] of mapProperties) {
        if (typeof (obj[m]) === 'function') {
            continue
        }
        const result = /*(typeof (obj[m]) == 'function') ? obj[m]() :*/ obj[m]
        if (result) {
            cb(result as string, results, context)
        }
    }
}

export const mapMethodsOrProperties = (obj: any, mapProperties: [prop: string, cb: PropertyObtainedCB][], results?: string[], context?: any) => {
    mapPropertyProperties(obj, mapProperties, results ?? [], context)
    mapMethodProperties(obj, mapProperties, results ?? [], context)
}