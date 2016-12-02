/**
 * @license Created by felix on 16-12-2.
 * @email   307253927@qq.com
 */
'use strict';

import gulp from 'gulp';
import QQ from './src/main';

gulp.task('start', () => {
  new QQ();
});