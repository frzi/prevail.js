const prevail = (() => {
	let patterns = {
		comments: /\{\#[\s\S]+?\#\}/gi,
		endTags: /\{\%\s*(endfor|endif)\s*\%\}/gi,
		forEntries: /\{\%\s*for\s+([\w|\s,]+)\s+in\s+(\w+)\s*\%\}/gi,
		if: /\{\%\s*if\s+([\s\S]+?[\%\}]?)\s*\%\}/gi,
		filters: /\|/g,
		variables: /\{\{([\s\S]+?[\}\}]?)\}\}/gi,
		whitespace: /\s{2,}/gi,
	}

	let symbols = {
		comment: '#',
		for: 'for',
		endfor: 'endfor',
		if: 'if',
		elif: 'elif',
		else: 'else',
		endif: 'endif',
		tag: '%'
	}

	let filters = {
		length: 'length',
		lower: 'toLowerCase()',
		upper: 'toUpperCase()',
	}

	// Helper functions.
	const trim = el => el.trim()
	const validOnly = el => !!el

	function parse(str) {
		let variables = new Set()
		let scopeVariables = new Set()

		let fnBody = 'let _s = \''

		fnBody += str
			// First remove all the redundant stuff.
			.replace(patterns.whitespace, '')
			.replace(patterns.comments, '')

			// Tags (for loops, conditionals, etc...)
			// if
			.replace(patterns.if, (c, condition) => {
				return `'; if (${condition}) { _s += '`
			})
			// object.entries
			.replace(patterns.forEntries, (c, vars, obj) => {
				variables.add(obj)
				return `'; for (let [${vars}] of Object.entries(${obj})) { _s += '`
			})
			.replace(patterns.endTags, () => {
				return `' } _s += '`
			})

			// Variables.
			.replace(patterns.variables, (c, varName, pos) => {
				if (varName.trim().length) {
					// Check for filters.
					let parts = varName.split(patterns.filters).map(trim)

					let applyFilters = []
					let fallback = `''`

					if (parts.length) {
						varName = parts.shift()
						applyFilters = parts.map(filter => filters[filter]).filter(validOnly)
					}

					let parsed = `'+(${varName}||${fallback})`
					if (applyFilters.length) {
						parsed += '.' + applyFilters.join('.')
					}
					parsed += `+'`

					variables.add(varName)
					
					return parsed
				}
				return ''
			})

		fnBody += `';return _s;`

		console.log(fnBody)

		// Arguments. (Using object destructuring.)
		let arg = []
		for (const variable of variables.values()) {
			arg.push(variable)
		}
		arg = '{' + arg.join(',') + '}'

		console.log(arg)

		// Return the function.
		return new Function(arg, fnBody)
	}

	return {
		filters, patterns, parse
	}
})()