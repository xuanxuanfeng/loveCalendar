const fs = require('fs')
const path = require('path')
const os = require('os')

// 在独立目录打包，源文件中的 ../shared 引用始终保持不变。
function prepareCloudFunctions(outputDir) {
  const sourceRoot = path.resolve(__dirname, '../cloudfunctions')
  const root = outputDir ? path.resolve(outputDir) : fs.mkdtempSync(path.join(os.tmpdir(), 'loveCalendar-deploy-'))
  fs.mkdirSync(root, { recursive: true })
  const names = fs.readdirSync(sourceRoot).filter(name => fs.existsSync(path.join(sourceRoot, name, 'index.js')))
  for (const name of names) {
    const target = path.join(root, name)
    if (fs.existsSync(target)) throw new Error(`打包目录已存在：${target}`)
    fs.cpSync(path.join(sourceRoot, name), target, {
      recursive: true,
      filter: file => path.basename(file) !== 'node_modules' && path.basename(file) !== 'shared'
    })
    const entry = path.join(target, 'index.js')
    const code = fs.readFileSync(entry, 'utf8')
    if (/require\(['"]\.\.\/shared\//.test(code)) {
      fs.cpSync(path.join(sourceRoot, 'shared'), path.join(target, 'shared'), { recursive: true })
      fs.writeFileSync(entry, code.replace(/require\((['"])\.\.\/shared\//g, 'require($1./shared/'))
    }
  }
  fs.writeFileSync(path.join(root, 'cloudbaserc.json'), JSON.stringify({
    envId: 'dev-5gu57acl6acc6a6b', functionRoot: '.',
    functions: names.map(name => ({ name, runtime: 'Nodejs18.15', handler: 'index.main', installDependency: true }))
  }, null, 2))
  return { root, names }
}

if (require.main === module) {
  const index = process.argv.indexOf('--output')
  console.log(JSON.stringify(prepareCloudFunctions(index === -1 ? undefined : process.argv[index + 1])))
}
module.exports = { prepareCloudFunctions }
