## 1.12.10049 (July 26, 2022)

- setting `php.workspace.includePath` allowing to specify additional directories to be included in IntelliSense.
- improves workspace loading, processes files better in parallel

## 1.12.10022 (July 25, 2022)

- fixes activation

## 1.12.9985 (July 20, 2022)

- **PHPUnit Tests Integration**
  - new UI for PHPUnit tests
  - **showing inline failure messages**
  - **debugging PHPUnit tests** using the new UI
  - **diff** of expected and actual values
  - smaller extension
  - avoids dependency to the old `ms-vscode.test-adapter-converter` **(can be uninstalled)**
  - avoids dependency to the old `hbenl.vscode-test-explorer` **(can be uninstalled)**
- optimized extension load, smaller installation package
- suggesting new parameter name based on its type hint
- union types properly inserted in newly generated Doc Comment (when typing `/**` above function)
- generated Doc Comment annotates thrown exceptions (`@throws` PHPDoc Tag)
- handles external changes, fixes re-indexing when composer packages are being installed/updated
- showing all classes in PHPDoc completion, will be auto-imported when commited (according to setting `php.format.autoimport`)
- fixes **Alpine Linux Arm64** platform
- fixes `phpTools.language` setting for various texts (summaries of various built-in functions and constats).
- fixes unused `use` warning being listed twice
- fixes rename refactoring of variables inside Doc Comments.
- not reporting missuse of `$this` in template files
- improved completion after functions noted in .phpstorm.meta file.
- improved completion after methods annotated with generic type within trait
- `php.format.autoimport-docblock` setting to configure completion of type names within Doc Block, `"FQN"` by default.

## 1.11.9762 (July 1, 2022)

- fixes completion after `enum`'s case (no completions listed)
- fixes tooltip over variables, resolved type name is correctly shortened

## 1.11.9761 (June 29, 2022)

- fixes error [#147](https://github.com/DEVSENSE/phptools-docs/issues/147)

## 1.10.9721 (June 25, 2022)

- fixes language server crash when completing the builtin `enum` member.

## 1.10.9716 (June 25, 2022)

- IntelliSense support for builtin `enum` methods and properties.
- Improves type inferring for array-typed properties.
- Laravel's Real-Time Facades recognized, and supported by code completion.
- Eloquent's Local Scopes listed in code completion.
- Fixes highlighting of unused `use` when it's used in an unused Doc Comment.
- Fixes Test Explorer for tests annotated with `@test` Doc Comment.

## 1.9.9585 (June 7, 2022)

- infers `@template` types in combination with `class-string<T>` type annotation
- automatically recognizes some non-standard file extensions to be parsed as PHP files as well (improves code completion on *Drupal*)
- fixes completion after reserved type names (`self`, `parent`, `static`)
- fixes `->` syntax after constants and class constants (*PHP 8.1*)
- fixes completion after `->` with `new` in the expression chain
- fixes changing PHP version

## 	1.9.9479 (May 25, 2022)

- improves Laravel Facades inferring on multi-core CPUs
- improves documentary comments processing, respects more conventions from phpstan and psalm
- improves code completion on generic types and generic `@mixin` types
- fixes possible crash on huge projects (StackOverflow fix)
- fixes possible completion issue, when 3rd party extension passes invalid LSP protocol data
- fixes issue handling breakpoints when there are many concurrent requests
- debugger stability improvements

## 1.9.9277 (April 29, 2022)

- **IntelliSense**
  - **support for generics**
  - IntelliSense handles specialized type names
  - templated types are resolved against bound generic arguments
  - generic types are infered from constructor arguments passed to `new()`
  - tooltips shows the generic arguments
  - IntelliSense understands `@template` arguments, and extended PHPDoc syntax (generics, psalm, phpstan)
  - IntelliSense completes special PHPDoc tags used for generics
  - code completion uses the template `of` type if the value is unbound
  - code analysis respects generics
- updated PHP syntax parser, fixes `instanceof` syntax
- fixes missing items in IntelliSense after installing/updating composer packages
- fixes for HTML/CSS/JS IntelliSense
- fixes items in IntelliSense after external file changes
- stubs include `zip` and `zlib` by default
- providing API for 3rd party extensions

## 1.8.8970 (March 23, 2022)

- adds missing `MYSQLI_` constants
- fixes PHPUnit runner; resolves correct `phpunit` PHP script
- fixes processing HEREDOC and NEWDOC syntax with empty lines and indentation
- fixes parser to allow PHP 8 `readonly` modifier in constructor property
- fixes `phpTools.language` setting, PHP manual is localized properly
- unused `use` check respects `@Method` PHPDoc tag
- fixes freezing during resolving PHP binaries and related PHP information
- `php.linkedEditing.variables`: setting to enable linked editing for local variables (`false` by default, `editor.linkedEditing` needs to be enabled)
- `editor.linkedEditing`: avoids bad edits when the whole variable name is deleted
- `editor.linkedEditing`: keeps the linked variable names even after they get deleted
- debugger listens on both IPv4 and IPv6, supports optional launch configuration `"hostname"`
- debugger fixes for arrays
- `php.version` setting is respected by the editor even there is no matching `php` executable
- `composer.json` is checked for the minimum PHP version, if `php.version` setting is not set
- **web** extension shows and allows to change PHP language level

---

- extension does not download external dependencies; makes the initial run faster and reliable
- extension does not expect `dotnet` runtime installed on the system
- language server supports incremental text edits to lower protocol overhead
- new platforms supported: `alpine-x64`, `win32-arm64`, `darwin-arm64`

## 1.7.8766 (March 8, 2022)

- updates IntelliSense with `ctype` books
- updates IntelliSense with STD constants
- functions marked with `@ignore` are not listed in completion and signature help
- completion after `new` lists variables as well
- optimizations

## 1.7.8717 (March 4, 2022)

- language server stability fix of a possible issue (when using ORM notation)
- `"php.debug.port"` can be set in workspace scope settings.
- debugging tests fix; uses correct port from `"php.debug.port"` or `9003` by default.
- Laravel static Facades recognized in IntelliSense
- Laravel class aliases recognized in IntelliSense
- improves code parser with PHPDoc

## 1.7.8637 (February 26, 2022)

- web extension load fix

## 1.7.8627 (February 25, 2022)

- debugger reports correctly when one or all of the ports are not available
- fixes missing `E_` constants in IntelliSense
- PHPUnit debugger respects Xdebug port setting "`php.debug.port`" instead of using hardcoded port `9000`

## 1.6.8588 (February 19, 2022)

- debugger "exclude" launch setting allows to negate the path with `!` prefix, i.e.:
  ```json
  "exclude": ["!**/app/**", "!**/vendor/mypackage/**"]
  ```
- debug won't launch if no Xdebug ports are available
- if Xdebug port can't be used, the detailed message is reported to the debug output panel
- installation: downloading dependencies with alternative locations
- IntelliSense prefers PHPDoc type annotation over the type hint (more specific completions)
- Doctrine ORM attributed annotation used for properties type annotation
- Language Server avoids using File System Watcher improving performance on Unix based system ([#521](https://community.devsense.com/d/521))
- smaller installation package
- setting `"php.stubs"` allowing to explicitly set names of extensions to be included in the IntelliSense, localized manual, and code analysis.
- added support for **linked editing** (`"editor.linkedEditing": true`) for local variables

---

- new platform supported: `web`

## 1.6.8479 (February 11, 2022)

- fixed preview of string values
- optimized file parsing

## 1.6.8448 (February 10, 2022)

- code analysis shows the incorrect declaration of PHP 8.1 `readonly` property
- fixes code-lens in virtual PHP manual files (when navigated to a builtin PHP with Go To Def (`F12`))
- virtual PHP manual displayed as a VS Code virtual document (does not create tmp file on disk)
- **PHPUnit runner and debugger** setting `phpunit.phpunit` to specify phpunit binary

## 1.6.8324 (January 28, 2022)

- **debugging adornments**
- extended compatibility
- code lens for enum cases
- `php.debug.port` and launch port setting allow to listen on multiple ports. `[9003, 9000]` by default.

## 1.5.8292 (January 25, 2022)

- fixes debug tooltips and debug watch

## 1.5.8280 (January 24, 2022)

- **debugging** launch improvements, provides every option on how to start debug according to current file or workspace
- provides advanced commands for running and debugging PHP files and projects
- added setting `php.debug.port` specifying the default Xdebug port
- the editor complies with PHP 8.1 by default, if not specified otherwise
- code lens minor updates
- fixes false warning about missing "php"
- fixes extension dependencies
- fixes extension activation time

## 1.5.8204 (January 17, 2022) preview

- **Code Lens**
  - references, method overrides, trait uses, type implementation, method prototype implementation
  - peeks the references in the references window
  - setting to enable/disable: `php.codeLens.enabled`. By default `true`.
- if no `php` is set for the workspace, the editor picks the highest defined in `php.executables` setting
- improves completion and tooltips after nullable type-hints
- improves code analysis for `trait` with private abstract functions
- improves code analysis for use of `[]`
- improves code analysis about `isset` in global code
- improves analysis of the missing implementation of abstract methods
- validation for PHP 8.1 intersection types (check for use of scalars, check for valid types used)
- added missing modifier keywords to completion within function header
- fixes **Testing** to allow to run all tests (`Run all tests` in *Testing* panel)

## 1.4.8059 (December 20, 2021) preview

- detected PHP binaries may have invalid configuration, PHP Tools will report the warning and use the binaries anyways if a user wants so.
- diagnostic reports improper use of `static` in parameter type hints
- shortens type names inside PHP 8.1 intersection types in tooltips according to the current namespace
- updated color tooltips with PHP 8.1 syntax

## 1.4.8033 (December 17, 2021) preview

- fixed *overflow to double* problem underline position
- debugger respects user arguments over its forced arguments
- avoids suggesting adding `use` if it's already there in some cases ([#127](https://github.com/DEVSENSE/phptools-docs/issues/127))
- updated PHP manual
- updated code completion within PHP 8 attributes
- avoids reporting ByRef issues as an error, reports as a warning instead
- folding HEREDOC blocks
- possible fix of resolution of existing `php` on Windows
- PHP 8.1 intersection types (parsed, resolved)

> *note: type inferring and tooltips do not handle intersection types completely yet*

## 1.4.7597 (September 30, 2021) preview

- updated inferred type analysis of built-in functions
- highlights `case` within `switch`
- fixed possible stack overflow exception

## 1.4.7534 (September 21, 2021) preview

- fixes crashing when code contains huge nested expressions
- fixes language server protocol
- improves code analysis for `array_pad()`, `array_fill()`
- fixes false positive warning for chained use of `[]` in LValue
- memory optimizations

## 1.4.7520 (September 19, 2021) preview

- memory optimizations
- fixes crashing when code contains huge nested expressions

## 1.4.7494 (September 15, 2021) preview

- function return value summary displayed in tooltips
- fixes refactoring actions
- fixes code actions
- fixes PHPDoc generator
- optimizes protocol

## 1.4.7449 (September 7, 2021) preview

- improves analysis of `$this`
- improves error reporting of unused variables
- fixes whole document formatting
- fixes formatting of variable-less `catch`
- fixes an occasional issue when no debug port is specified
- internal performance improvements for JSON protocol
- fixes debugging documents without a workspace *(just an opened file without workspace or folder)*
- updated PHP manual
- fixes PHP parser - `readonly` is treated as it should according to PHP version

## 1.4.7295 (August 17, 2021) preview

- **PHP 8.1** syntax, code sense, and checks
  - read-only properties
  - final class const
  - new in initializers
  - new callable syntax
- updated PHP manual
- fixes incorrectly reported deprecations
- fixes incorrect parameteres with 'null' type hint

## 1.4.7254 (August 15, 2021) preview

- **Debug**
  - allows compound launch
  - allows more debug sessions at once
  - Xdebug port doesn't have to be specified (the `"port"` launch configuration)

## 1.4.6982 (July 15, 2021) preview

- when auto-import enabled, completions shows all possible types within possible namespaces
- automatically completes fully-qualified-name when auto-importing and there is a conflict with existing alias
- shows *(auto import)* in completion, if auto-importing will happen
- completion better lists variables
- optimizations
- when there are multiple types to auto-import, they are all shown in the completion list to choose from

## 1.4.6842 (June 22, 2021) preview

- automatic import of alias when completion
- setting `php.format.autoimport`
  - **auto-import option**: auto imports alias when completing types/function/constants out of namespace scope
  - **fqn**: inserts fully qualified name upon completion
  - **none**: inserts name as it is
  - **hide**: does not show inaccessible symbols in code completion
- fix position of light bulb for code action for fully qualifying name
- strikes out deprecated symbols in code completion

## 1.4.6822 (June 19, 2021) preview

- updated code analysis and code completion
- recognizes more undocumented `.phpstorm.meta.php` constructs ([#102](https://github.com/DEVSENSE/phptools-docs/issues/102))
- fixes PHPUnit TestCase MockObject type analysis ([#102](https://github.com/DEVSENSE/phptools-docs/issues/102))
- code action for simplifying fully qualified names ([#88](https://github.com/DEVSENSE/phptools-docs/issues/88))

## 1.4.6762 (June 07, 2021) preview

- PHP version picker ([see Selecting PHP in docs](https://docs.devsense.com/en/vscode/editor/php-version-select))
- `.editorconfig` problems conventions ([see Problems in docs](https://docs.devsense.com/en/vscode/problems#editorconfig))
- `"php.problems.scope"` setting (ignoring "vendor" folder by default) ([see Problems in docs](https://docs.devsense.com/en/vscode/problems#phpproblemsscope))
- debugging improvements
- exception handling - always break on fatal error, option to choose whether to break on handled errors/exceptions

---

## 1.3.6645 (May 25, 2021) preview

- debugging fixes and improvements
- debugging UX improvements

## 1.3.6632 (May 21, 2021) preview

- **Test Explorer** lists tests without running them
- Test Explorer supports tests with data sets properly
- tests get retired (grayed) if the source is modified
- optimized **debug protocol**

## 1.3.6616 (May 21, 2021) preview

- new **Test Explorer** (requires `hbenl.vscode-test-explorer`)
- debugging has been updated with support for multiple request handling, stability enhancements, corectness
- debugging supports detach
- optimizes Xdebug protocol
- **PHP 8.1** syntax support, `never` return type, `enum`, octal number notation
- completion of static methods after `$this->`
- `#[NoReturn]` attribute supported

---

## 1.2.6549 (May 12, 2021) preview

- fixes debug implementation (unexpected debug sessions closing)
- fixes debug breakpoints
- optimizes Xdebug protocol
- fixes HEREDOC parser
- fixes named parameters analysis for special names
- fixes PHP 8 parsing and invalid syntax errors
- optimizations

## 1.2.6469 (April 24, 2021) preview

- code action for **sort uses** (PSR-12)
- reports curly braces as deprecated since PHP 8.0
- support for remote file systems
- type analysis improvements

## 1.2.6305 (April 04, 2021) preview

- shows PHP version in status bar without suffix
- hotfix for macOS, downloading runtime package

## 1.2.6273 (March 30, 2021) preview

- code action for **generating constructors**
- code action for **getter/setter** respect field staticness
- fixes code actions
- faster code completion popup
- faster tooltip display for variables

## 1.2.6177 (March 17, 2021) preview

- memory optimizations
- fixes for Node.JS on IA-32 architectures
- fixes `PHP0423` for ambigous function declarations
- does not list names of anonymous classes in completion

## 1.2.6021 (Feb 17, 2021) preview

- PHPDoc generated for local variables and globals when user types `/**` above them
- updated PHP manual with more PHP 8 declarations
- pretty-print after `::class` and `fn` fixes
- avoided a few falsely reported problems
- fixes type analysis for reserved keywords within PHPDoc `@return` tag
- more details in tool-tips for built-in type keywords
- DBGp Proxy support fixes for the server downloaded from the Xdebug home page

## 1.2.5988 (Feb 10, 2021) preview

- fixes language server crash (stack overflow exception)
- more tollerant problems validation
- code analysis improvements

## 1.2.5973 (Feb 08, 2021) preview

- code analysis overall improvements, finally blocks fixes, constrained constants not reported
- refactoring and highlight occurence fixes for global constants in a namespace
- improved performance
- (linux, macOs) fixes server not being closed after VSCode shutdown or folder closed

## 1.2.5931 (Jan 31, 2021) preview

- rename refactoring allows to rename dynamic names
- language server crash fix when `__construct` contains trailing comma
- updated pcre check
- type analysis improvements, less falsely warnings
- improved analysis of standard functions
- improved analysis of try/catch blocks
- tolerant to mismatching PHPDoc type annotation of properties
- type check looks into subtypes of traits and interfaces, not being so strict
- fixed code actions and quick fixes

## 1.2.5887 (Jan 23, 2021) preview

- rename refactoring with preview
- pretty print of `use` groups
- built on .NET 5.0 (having `.NET 5.0 Runtime` avoids additional downloads)
- treats subtypes when resolving methods
- handles trait users improving analysis of trait and go to definition for methods in subtypes
- improves code analysis and type analysis
- avoids a lot of falsely warnings
- go to definition of parent of anonymous class fix

## 1.2.5843 (Jan 18, 2021) preview

- files in source controlled folders are ignored when changed (.git, .history, .svn)
- fixes PHP version in status bar - only shown when editing a PHP file
- optimizations
- updated PCRE check
- fixed code completion at the very end of document

## 1.2.5783 (Jan 04, 2021) preview

- respects `@template` annotation in PHPDoc
- handles inline `@var` annotation
- signature help for ambiguous constructors (`new \ReflectionMethod`)
- PHPDoc array type with union elements annotation (`array<A\B\C>`)
- PHPDoc allows for nullable type annotation (e.g. `?int`)
- optimizations
- improves code analysis, avoids some false positives
- improves code flow analysis, isset(), is_resource(), and type inference
- improves analysis for lambda function use variables
- CLI specific constants and variables are allowed and code completed
- updates `.phpstorm.meta.php` parser for type inference
- does not respect PHP4-style ctor when using PHP 7.1+
- fixes "Go to Implementation" in case of an anonymous class
- fixes return check of generator functions
- fixes check for `__clone()` magic method, can be private
- fixes check for array access on `\SplObjectStorage`
- fixes case and array key duplicity check for non-printable characters

---

## 1.1.5686 (Dec 23, 2020) preview

- support for `@mixin` annotations
- support for `@method` annotation with `$this` return type
- handles nullable type annotation in PHPDoc
- fixes resolution of type names in PHPDoc blocks
- fixes some incorrectly reported warnings (mostly an unknown method warning)
- updated pcre check
- can be installed on linux-arm64
- improves type names in tool tips
- code formatting for `match` expressions
- fixes code validation of class declaration
- updated integrated PHP manual

## 1.1.5620 (Dec 12, 2020) preview

- syntax checks respect current PHP version including 8.0.
- more quick fixes for invalid union types
- updated pcre check
- tool-tip type names rendered shorter

## 1.1.5595 (Dec 04, 2020) preview

- named arguments code completion (PHP 8)
- named arguments hover information
- functions annotated with `#[Deprecated]` attribute reported in diagnostics
- diagnostics for matching or unknown named arguments (PHP 8)
- diagnostics for `iterable` type hint
- diagnostics for nullable types
- diagnostics for union types (PHP 8)
- `null` type name within unions (PHP 8)
- improved `.phpstorm.metadata.php` annotations
- support for Xdebug 3.0 and PHP 8.0 debugging

## 1.1.5532 (Nov 21, 2020) preview

- updated PSR-2 code formatting
- warning `PHP0415` for use of an undefined constant
- warning `PHP0418` for use of an undefined method
- code fix for `PHP0415` if it might be a local variable
- doctrine annotations in code completion
- fixes class name completion within PHPDoc
- updated global constants in code completion and analysis
- updated PHP manual translations

---

## 1.0.5403 (Oct 28, 2020) preview

- analysis of class properties
- fixes type hint for magic methods
- stability fixes

## 1.0.5342 (Oct 20, 2020) preview

- PHP 8 new attribute syntax `#[]`
- more code suggestions
- improves unused `use` diagnostic when used in PHPDoc
- improves underlining of problems in opened document when typing
- `@suppress` and `@SuppressWarnings` PHPDoc tags allowing to ignore specified warnings within class/function
- supports more PHPDoc array syntax conventions
- improves analysis of `isset()` and `new static()`

## 1.0.5264 (Sep 30, 2020) preview

- fix for double-dollar `$$` character in code completion of a variable

## 1.0.5229 (Sep 22, 2020) preview

- diagnostic and quick fix for names that can be simplified
- diagnostic for unused parameters in constructors and private functions
- updates of externally modified files (`*.php`)

## 1.0.5153 (Aug 28, 2020) preview

- `@dataProvider` PHPDoc attribute; code sense, navigation, completion
- implement missing abstracts quickfix respects original `public` keyword
- PHP 8.0 null-safe operator supported
- PHP 8.0 `match` construct supported (must have PHP >=8.0 `phpExecutable`)
- fix of `quick fix` for overlapping problems
- stability fixes

## 1.0.5087 (Aug 17, 2020) preview

- deduplicated quick fixes
- improved type analysis of expressions enclosed in parenthesis
- unknown type name in PHPDoc gets quick fix
- mouse hover shows whether function returns `null` as well (`void` is shown as `null` eventually)
- *go to implementations* for methods
- provides quick fix for invalid base classes
- code completion after `namespace` keyword

## 1.0.5044 (Aug 11, 2020) preview

- quick fix for unknown class names in PHPDoc
- quick fix to remove unnecessary `use`
- `iterable` phpdoc type hint
- load status indicator in status bar at left
- current PHP version indicator in status bar (bottom right)
- workspace re-analysed lazily when code is changed (disable with [`"php.problems.workspaceAnalysis": false`](https://docs.devsense.com/en/vscode/configuration#configuration-options))

## 1.0.5029 (Aug 07, 2020) preview

- "go to implementations" support
- `SonarSource.sonarlint-vscode` not reported as incompatible
- fixes "go to" of interface names after `extends` keyword
- deprecations are rendered with a strike through 

## 1.0.5015 (Aug 06, 2020) preview

- "find all references" of `__construct` includes class instantiations
- "find all references" perf.
- problems analysis improvements
- improved analysis of inline PHPDoc type hints
- some problems related to other problems are not reported
- parser fixes

## 1.0.4975 (July 29, 2020) preview

- performance improvements
- problems analysis improvements
- improves workspace loading
- logging of workspace load failures

## 1.0.4934 (July 19, 2020) preview

- standalone `@deprecated` not ignored
- few performance improvements
- fixes duplicities in reported problems
- some problems caused by other problems not reported
- workspace loading and code editing improvements

## 1.0.4908 (July 13, 2020) preview

- less falsely positive warnings
- improved type analysis of `static` and properties
- PHP 8.0 (Alpha 1) syntax supported
- New PHP 8.0 compatibility warnings
- fixed implements abstracts for trait members
- improved formatting when using tabs

## 1.0.4698 (May 19, 2020) preview

- better placement of `use` quick action

## 1.0.4666 (May 06, 2020) preview

- fixes for systems without .NET Runtime (3.x or 5.x) installed

## 1.0.4654 (May 05, 2020) preview

- improved run of all tests (runs within single process now)
- PHPDoc type hints in `@method` respect current namespace
- locals in arrow function used from parent scope and annotated properly

## 1.0.4608 (April 17, 2020) preview

- configuration snippet for `Launch current script in console` fixed
- HTML tooltips in PHP script
- `<` triggers HTML completion
- PCRE patterns check (within `preg_*` functions)
- PHPDoc `@method` with vararg supported
- unused `use` highlighting respects custom PHPDoc tags
- Test Explorer fixes:
  - debugging session closed after test finishes
  - test cases can be debugged without additional configuration
  - fixes exception upon test run

## 1.0.4394 (January 23, 2020) preview

- fixed completion of variables (`$` prefix is not duplicated)

## 1.0.4277 (December 10, 2019) preview

- code flow analysis improvements for `finally` blocks
- makes use of `dotnet` 3.1 if installed on the system
- minor fixes, and updates to stabilty issues

## 1.0.4229 (November 22, 2019) preview

- `Implement abstracts` **code action** & **quick fix** (interfaces and abstract members)
- `Add getter/setter` **code action** for fields and multiple fields
- updates to stability issues

## 1.0.4187 (November 10, 2019) preview

- code editor fixes (occuring when format on save, format on paste)
- completion inside PHPDoc

## 1.0.4168 (November 4, 2019) preview

- improved listing symbols in document/workspace
- listing properties when searching prefixed with `$`
- navigation to trait uses

## 1.0.4145 (October 24, 2019) preview

- problems check for not implemented functions
- problems check for traits
- improved tooltips and performance
- updated builtin PHP manual
- debugger reports common issues human friendly

## 1.0.4009 (September 23, 2019) preview

- `{@link}` in tooltips shown as hyperlink
- `{@inheritdoc}` gets substituted according to PHPDoc specs.
- updated blade templating editor (`@section`, `@yield`) and formatting fixes
- embedded HTML fixes
- stability fixes, improved internal error logging
- reporting problems improvements

## 1.0.3951 (September 9, 2019) preview

- generated PHPDoc respects type hints
- generated PHPDoc treats nullable types correctly
- language server crash fix
- avoids spawning `rg.exe` when running `composer install|update` (fixes system freezing)

## 1.0.3936 (September 5, 2019) preview

- PHAR files in workspace get parsed
- **code completion** includes declarations from PHAR files
- **go to definition** supports content in PHAR files
- **navigation** through entries in PHAR files
- **signature help** and **tooltips** for declarations in PHAR files
- minor fixes and improvements

## 1.0.3774 (August 1, 2019) preview

- formatting of typed properties
- completion after `use` is filtered by class name
- obtaining long data from Xdebug

## 1.0.3748 (July 24, 2019) preview

- classes/interfaces/traits not available in current namespace or uses are not listed in code completion
- dynamic class aliasing supported in code completion and type analysis (`class_alias()` and Joomla registered aliases)
- PHP in blade blocks (`.blade.php`) (except syntax highlighting)
- improved type analysis of arguments passed by reference
- fixed pasting when `Format on Paste` is enabled (HTML was corrupted)

## 1.0.3703 (July 17, 2019) preview

- performance optimizations
- `php.problems.workspaceAnalysis` setting to enable/disable workspace-wide problems analysis
- array unpack type check

**PHP 7.4 support**

- PHP 7.4 support (arrow functions, typed properties, spread array, `??=` operator, underscores in numbers)
- PHP 7.4 features reported when using PHP < 7.4
- PHP 7.4 features analysis, type analysis, problems analysis
- spread array type check

## 1.0.3645 (July 11, 2019) preview

- improved project load and background analysis
- `.phpstorm.meta.php` (version 2016.2+) processed
- Code completion and analysis of IoC
- fixed formatting for nullable types
- formatting pretty-prints opening bracket `{`
- formatting code style defaults to `PSR-2`

## 1.0.3603 (July 8, 2019) preview

- fixed issue when some warnings disappear and after few secs appear
- improved CPU use when opening/closing documents
- fixed formatting around `?:` and `::`
- improved code analysis evaluation
- less strict analysis of use of uninitialized variables
- completion after `use` gets fully qualified names

## 1.0.3593 (July 5, 2019) preview

- diagnostics of magic methods
- diagnostics of duplicit function parameters
- improved type analysis of numbers
- launching debugger enhancements
- PSR-2 formatter fixes

## 1.0.3574 (July 2, 2019) preview

- improved type analysis of `explode()`, `microtime()`, Oxid framework
- `catch` variable diagnostics and analysis

## 1.0.3547 (June 27, 2019) preview

- formatter improvements
- DBGP proxy support
- improved unused variable diagnostic

## 1.0.3525 (June 24, 2019) preview

- anonymous functions type analysis
- anonymous functions annotated with PHPDoc
- anonymous functions details in tool tips
- signature help with function return type
- dimmed unused variables
- loading project performance, responsiveness

## 1.0.3507 (June 22, 2019) preview

- fixed increasing number of untitled documents upon code format
- type analysis improvements
- inital support for dbgp proxy

## 1.0.3483 (June 17, 2019) preview

- updated PHP manual
- validation of value passed to `define()`
- validation of use of `define()` on PHP >= 7.3

## 1.0.3471 (June 12, 2019) preview

- support for logpoints
- `php.format.codeStyle` can be set in the workspace scope
- code formatting fixes, indentation after opening tag, blocks on a new line
- `html`+`php` formatting fix for overlapping ranges error

## 1.0.3435 (May 28, 2019) preview

- fix for disabling breakpoints
- optimized debug protocol

## 1.0.3428 (May 27, 2019) preview

- updated PHP manual for the latest PHP 7.3 and PHP 7.4 constructs
- updated readme

## 1.0.3386 (May 9, 2019) preview

- Disabled warning PHP0424 when passing an object in foreach
- Analysis of use params within lambda function
- Minor code navigation fixes
- Minor code formatting fixes

## 1.0.3348 (Apr 23, 2019) preview

- signature helper fixed, showing the correct parameter
- fixes running the extension when there is no `dotnet`
- works with `dotnet` 3.0

## 1.0.3241 (Mar 4, 2019) preview

- PHPDoc generation with parameter names

## 1.0.3230 (Feb 27, 2019) preview

- PHPDoc blocks inserted with placeholders (snippet)
- PHPDoc tags snippets
- PHP compatibility warnings
- fixed not disappearing warnings after file delete
- fixed pretty-print of `die()` construct
- fixed formatting for function headers and properties

## 1.0.3202 (Feb 20, 2019) preview

- updated PHP manual
- format on type (`;` and `}`)
- format profile `Off`
- formatting not applied when code is syntax invalid

## 1.0.3185 (Feb 14, 2019) preview

- code completion in PHPDoc for PHPDoc keywords (after `@`)
- code actions for typos in PHPDoc and unknown type names in PHPDoc

## 1.0.3174 (Feb 12, 2019) preview

- code action for adding `use ;` when applicable
- code action to fully qualify type name when necessary
- generating `PHPDoc` when user types `/**` (`formatOnType` must be enabled)
- selection format
- localized messages - en, de, ja, tz, es

## 1.0.3058 (Dec 30, 2018) preview

- improved code formatting
- few texts localized to german

## 1.0.3031 (Dec 3, 2018) preview

- folding collapses the inner range
- formatting code style setting `php.format.codeStyle`
- PHPDoc for local variables with multiple `@var`/`@global` tags
- code suggestion to add `$this->` if applicable

## 1.0.3003 (Nov 26, 2018) preview

- code suggestion for an unknown class error
- unnecessary `use` directives are rendered as fade out
- `F10` and `F11` start debugging and stop on entry
- `exclude` launch configuration - patterns that will be skipped from debugging when stepping
- debugger allows setting a variable or property value
- debugger supports long strings
- debugger supports paging for large arrays
- test explorer optimization
- generated files are not included in user's workspace
- test explorer shows only user's tests, only if there is no `phpunit.xml` in root then all tests in recursive dirs are listed

## 1.0.2930 (Nov 3, 2018) preview

- display language setting `phpTools.language` can be changed without reloading the workspace
- changing setting `php.problems.exclude` updates the problems window
- a file changed outside the editor gets updated
- stability fixes

## 1.0.2915 (Oct 30, 2018) preview

- debugger allows inspecting stack frames and locals value
- experimental: setting `files.exclude` is handled
- experimental: setting `php.problems.exclude` allows ignoring specified folders and all or specified problem codes
- not completing items right after <?
- highlighting references under caret optimization

## 1.0.2895 (Oct 23, 2018) preview

- project problems are updated after the workspace is loaded
- some false warnings are not reported
- `pathMappings` launch configuration
- fix: closing language server process on Unix systems
- fix: working with large mixed HTML/JS/CSS/PHP code
- signature help for new objects
- memory and perf. optimization
- stability fixes
- project startup optimizations
- code folding for all parenthesis

## 1.0.2802 (Oct 11, 2018) preview

- option to activate license/request trial offline
- option to mute warning about missing PHP
- tests are not loaded and run automatically (either enable `autorun` or click `reload`/`start`)
- debug watch tooltip provides expandable object properties
- more detailed output log about PHP and Xdebug that will be used for debugging/tests
- `F5` starts debugging of current script even without having `launch.json` configuration  
- does not provide basic completion after `:` (but `::`)
- code completion handles ambiguous trait declarations

## 1.0.2765 (Oct 8, 2018) preview

- Symbols in workspace feature.
- Processing all files mapped to `php` language.
- Code completion improvements.

## 1.0.2738 (Oct 3, 2018) preview

- Test Explorer detects phpunit.xml.dist to get enabled
- code completion handles ambiguous types better
- short open tags `<?` allowed if there is no normal open tag `<?php`
- updated readme and documentation
- re-enabled completion after $ (fixes recent update in VSCode)

## 1.0.2681 (Sep 27, 2018) preview

- option to request trial license
- downloading dependencies from CDN
- updated the extension's publisher ID

## 1.0.2590 (Sep 14, 2018) preview

- triggering completion after ->, $, \, ::
- code folding for blocks, comments, PHPDoc and regions
- language server providing
    - code completion
    - hover
    - formatting
    - code structure
    - signature help
    - find all references
    - navigation
    - go to definition
    - refactoring
    - highlighting
- code analysis and validation
- debug support
    - watch
    - debug mouse watch
    - breakpoints
    - UNC paths
    - path mapping
    - remote debug, console, built-in server
- workspaces
- UNC paths
- built-in PHP server
- PHPUnit Test Explorer
    - Live testing
    - Tests debugger
    - Tests browser
- Initial version of PHP Tools for VS Code
